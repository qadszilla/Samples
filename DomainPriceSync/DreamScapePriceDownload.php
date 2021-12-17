<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class DreamScapePriceDownload extends Command
{
    /**
     * The name and signature of the console command
     *
     * @var string
     */
    protected $signature = 'DreamScape:PriceDownload';

    /**
     * The console command description
     *
     * @var string
     */
    protected $description = 'Download domain prices from Dreamscape';

    /**
     * Create a new command instance
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        for ($x = 1; $x <= 20; $x++)
        {
            $requestId = md5($x.uniqid().microtime(true));
            $signature = md5($requestId.env('DREAMSCAPE_APIKEY'));
            $response = Http::timeout(5)->retry(3, 900)->acceptJson()->withHeaders(['Api-Request-Id' => $requestId, 'Api-Signature' => $signature])->get('https://reseller-api.ds.network/domains/tlds?currency=AUD&page='.$x.'&limit=100');
            if ($response->successful())
            {
                $json = json_decode($response->body());
                foreach ($json->data as $k => $row)
                {
                    if ($row->price->register > 0)
                    {
                        $i = [
                            'source' => 'dreamscape',
                            'tld' => $row->tld,
                            'min_period' => ($row->min_period / 12),
                            'max_period' => ($row->max_period / 12),
                            'price_register' => $row->price->register,
                            'price_renew' => $row->price->renew,
                            'price_transfer' => $row->price->transfer,
                            'eligibility_required' => ($row->eligibility_required) ? 'y' : 'n'
                        ];
                        DB::table('domain_prices')->updateOrInsert($i);
                    }
                }
            }
        }
        DB::update('update `domain_prices` SET `sorting_weight` = (`price_register`*`min_period`)');
        return Command::SUCCESS;
    }
}
