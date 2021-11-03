<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TppPriceCsvSync extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'TppPrices:SyncViaCsv';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync prices from TPP CSV file';

    /**
     * Create a new command instance.
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
        $contents = explode("\n", Storage::get('public/TPP.csv'));
        if (count($contents) > 0)
        {
            unset($contents[0]);
            foreach ($contents as $row)
            {
                if (!empty($row))
                {
                    list($tld, $price1Y, $price2Y) = explode(',', $row);
                    if (!empty($price1Y) && !empty($price2Y))
                    {
                        $min = 1;
                        $max = 2;
                        $price = number_format($price1Y, 2, '.', '');
                    }
                    if (!empty($price1Y) && empty($price2Y))
                    {
                        $min = 1;
                        $max = 1;
                        $price = number_format($price1Y, 2, '.', '');
                    }
                    if (empty($price1Y) && !empty($price2Y))
                    {
                        $min = 2;
                        $max = 2;
                        $price = number_format($price2Y, 2, '.', '');
                    }
                    $i = [
                        'source' => 'tpp',
                        'tld' => ltrim(trim($tld), '.'),
                        'min_period' => $min,
                        'max_period' => $max,
                        'price_register' => $price,
                        'price_renew' => $price,
                        'price_transfer' => $price,
                        'eligibility_required' => (str_ends_with($tld, '.au')) ? 'y' : 'n'
                    ];
                    DB::table('domain_prices')->updateOrInsert($i);
                }
            }
        }
        DB::update('update `domain_prices` SET `sorting_weight` = (`price_register`*`min_period`)');
        return Command::SUCCESS;
    }
}
