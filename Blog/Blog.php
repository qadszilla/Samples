<?php
class Blog extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('blog_model', 'blog');
    }
    /**
     * Index page
     */
    public function index()
    {
        if ($this->site->settings('cache_pages') == 'y')
        {
            $this->output->cache(60);
        }
        $data['metatags'] = 'blog.css';
        //sidebar
        $data['loop']['cats'] = $this->blog->categories();
        $data['loop']['recentPosts'] = $this->blog->recentPosts();
        $data['content'] = $this->load->view('Blog/Sidebar', '', true);
        //main page
        $this->load->library('pagination');
        $config['base_url'] = site_url().'blog';
        $config['total_rows'] = $this->blog->totalEntries();
        $config['per_page'] = 8;
        $config['uri_segment'] = 2;
        $config['first_link'] = 'First';
        $config['last_link'] = 'Last';
        $this->pagination->initialize($config);
        $data['nextpage'] = $this->pagination->create_links();
        $data['loop']['entry'] = $this->blog->getAllEntries($config['per_page'], $this->uri->segment($config['uri_segment']));
        $data['content'] .= $this->load->view('Blog/Index', '', true);
        $this->load->library('template', $data);
    }
    /**
     * Bot check for blog comments
     */
    public function bot_check($str)
    {
        if ($str != '')
        {
            $this->form_validation->set_message('bot_check', 'Are you a bot?');
            return false;
        }
        return true;
    }
    /**
     * blog entry page
     */
    public function entry($url_key)
    {
        if ($this->site->settings('cache_pages') == 'y')
        {
            $this->output->cache(60);
        }
        $this->form_validation->set_rules('id', 'post ID', 'required');
        $this->form_validation->set_rules('name', 'Name', 'trim|required');
        $this->form_validation->set_rules('email_address', 'Email address', 'trim|valid_email');
        $this->form_validation->set_rules('website', 'Website URL', 'trim');
        $this->form_validation->set_rules('comment', 'Comment', 'trim|required');
        $this->form_validation->set_rules('confirm_email_address', 'bot check Confirm email', 'trim|callback_bot_check'); //bot check
        if ($this->form_validation->run() == false)
        {
            $data['metatags'] = 'blog.css';
            //sidebar
            $data['loop']['cats'] = $this->blog->categories();
            $data['loop']['recentPosts'] = $this->blog->recentPosts();
            $data['content'] = $this->load->view('Blog/Sidebar', '', true);
            //category page show list of posts in the category
            if ($this->blog->isCategory($url_key))
            {
                $catData = $this->blog->cat($url_key);
                $data['catname'] = $catData->name;
                $this->load->library('pagination');
                $config['base_url'] = site_url().'blog/'.$url_key;
                $config['total_rows'] = $this->blog->totalEntriesInCat($catData->ID);
                $config['per_page'] = 8;
                $config['uri_segment'] = 3;
                $this->pagination->initialize($config);
                $data['nextpage'] = $this->pagination->create_links();
                $data['loop']['entry'] = $this->blog->getAllEntriesInCat($catData->ID, $config['per_page'], $this->uri->segment($config['uri_segment']));
                $data['content'] .= $this->load->view('Blog/CatList', '', true);
            }
            else //entry page
            {
                if (!$this->blog->isEntry($url_key))
                {
                    //see if the url key was changed recently for a blog entry
                    $check = $this->db->select('ID,type_id')->where('new_url !=', $url_key)->where('old_url', $url_key)->where('type', 'blog')->limit(1)->order_by('ID', 'DESC')->get('url_log');
                    if ($check->num_rows() == 1)
                    {
                        $log = $check->row();
                        $this->db->where('ID', $log->ID)->update('url_log', ['last_hit' => time()]);
                        $e = $this->db->where('ID', $log->type_id)->select('url_key')->limit(1)->get('blog_entries')->row();
                        redirect('/blog/'.$e->url_key, 'location', 301);
                    }
                    redirect('error');
                }
                $contents = $this->blog->entry($url_key);
                $data['title'] = $contents->seo_title;
                $data['keywords'] = $contents->seo_keywords;
                $data['description'] = $contents->seo_desc;
                $data['loop']['comments'] = $this->blog->entryComments($contents->ID);
                $data['content'] .= $this->load->view('Blog/Entry', $contents, true);
            }
            $this->load->library('template', $data);
        }
        else
        {
            $this->blog->addComment();
            $this->session->set_flashdata('commented', 'yes');
            redirect('/blog/'.$url_key.'#thanks');
        }
    }
    /**
     * Blog XML feed
     */
    public function rss()
    {
        if ($this->site->settings('cache_pages') == 'y')
        {
            $this->output->cache(60);
        }
        header('Content-type: text/xml');
        echo '<?xml version="1.0" encoding="UTF-8"?>
		<rss version="2.0">
		<channel>
		<language>en-US</language>
		<title>'.$this->site->site_name().'</title>
		<description>'.$this->site->site_name().' blog RSS feed</description>
		<link>'.site_url().'</link>
		<lastBuildDate>'.date(DATE_RFC822, time()).'</lastBuildDate>';
        $query = $this->db->order_by('stamp', 'DESC')->get('blog_entries');
        foreach ($query->result() as $row)
        {
            echo '<item>
			<title><![CDATA['.$row->title.']]></title>
			<description><![CDATA['.substr(strip_tags($row->content), 0, 500).'...]]></description>
			<comments>'.site_url().'blog/'.$row->url_key.'#comments</comments>
			<link>'.site_url().'blog/'.$row->url_key.'</link>
			<guid>'.site_url().'blog/'.$row->url_key.'</guid>
			<pubDate>'.date(DATE_RFC822, $row->stamp).'</pubDate>
			</item>';
        }
        echo '</channel></rss>';
    }
}
