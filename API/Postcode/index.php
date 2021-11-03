<?php
//validate api key
$apiKey = addslashes($_GET['api_key']);
include_once '../api/enforceKey.php';
//log the api request
$service = 'postoffice';
$_GET['location'] = addslashes($_SERVER['HTTP_REFERER']);
$apiData = json_encode($_GET);
include_once '../api/logger.php';
//process
//find out from the post office
function call($url)
{
    $serviceURL = 'https://digitalapi.auspost.com.au';
    $ch = curl_init($serviceURL.$url);
    curl_setopt($ch, CURLOPT_URL, $serviceURL.$url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['AUTH-KEY: <key-removed-from-sample>']);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 0);
    $xml = curl_exec($ch);
    curl_close($ch);
    return $xml;
}
//on 25/03/2016 the postoffice changed the service codes, this function takes the old and updates it to new
function serviceCode($c)
{
    $codes = [
        'INTL_SERVICE_ECI_PLATINUM' => 'INT_PARCEL_COR_OWN_PACKAGING',
        'INTL_SERVICE_ECI_M' => 'INT_PARCEL_EXP_OWN_PACKAGING',
        'INTL_SERVICE_ECI_D' => 'INT_PARCEL_EXP_OWN_PACKAGING',
        'INTL_SERVICE_EPI' => 'INT_PARCEL_STD_OWN_PACKAGING',
        'INTL_SERVICE_PTI' => 'INT_PARCEL_STD_OWN_PACKAGING',
        'INTL_SERVICE_RPI' => 'INT_PARCEL_STD_OWN_PACKAGING',
        'INTL_SERVICE_AIR_MAIL' => 'INT_PARCEL_AIR_OWN_PACKAGING',
        'INTL_SERVICE_SEA_MAIL' => 'INT_PARCEL_SEA_OWN_PACKAGING'
    ];
    $code = trim($c);
    $code = trim($codes[$code]);
    return ($code == '') ? $c : $code;
}
$weight = $_GET['weight'];
$code = $_GET['code'];
if ($_GET['country_code'] != 'AU')
{
    $code = serviceCode($_GET['code']);
}
//weight fix - if weight is 0, add 10g to it
if ($weight <= 0)
{
    $weight = 0.10;
}
//if the weight is more than 20kg, split into request
if ($weight > 20)
{
    $total = $weight;
    $groupShipping = 0;
    while ($total > 0)
    {
        $t = ($total > 20) ? 20 : $total;
        $url = str_replace("weight=$weight", "weight=$t", "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]");
        echo ($_GET['debug'] == 'y') ? $url.'<br>' : '';
        $s = file_get_contents($url);
        $groupShipping += ($s + 3); //add $3 to each broken unit to cover the costs
        echo ($_GET['debug'] == 'y') ? $s : '';
        $total -= 20;
    }
    echo $groupShipping;
    die();
    exit;
}
//if weight is more than 2kg and code is
//INTL_SERVICE_AIR_MAIL or INT_PARCEL_AIR_OWN_PACKAGING
//change the code to INT_PARCEL_STD_OWN_PACKAGING as INTL_SERVICE_AIR_MAIL
//doesn't handle more than 2kg
if ($code == 'INTL_SERVICE_AIR_MAIL' || $code == 'INT_PARCEL_AIR_OWN_PACKAGING')
{
    if ($weight > 1.9)
    {
        $code = 'INT_PARCEL_STD_OWN_PACKAGING';
    }
}
//Domestic shipping cost
if ($_GET['country_code'] == 'AU')
{
    if ($weight <= 0.125)
    {
        $lPackageHeight = 4;
        $lPackageWidth = 11;
        $lPackageLength = 22;
    }
    elseif ($weight < 0.3)
    {
        $lPackageHeight = 16;
        $lPackageWidth = 23;
        $lPackageLength = 4;
    }
    elseif ($weight < 0.55)
    {
        $lPackageHeight = 22;
        $lPackageWidth = 28;
        $lPackageLength = 8;
    }
    elseif ($weight < 1.5)
    {
        $lPackageHeight = 22;
        $lPackageWidth = 16;
        $lPackageLength = 8;
    }
    elseif ($weight < 2.5)
    {
        $lPackageHeight = 31;
        $lPackageWidth = 22;
        $lPackageLength = 11;
    }
    elseif ($weight < 3.5)
    {
        $lPackageHeight = 40;
        $lPackageWidth = 20;
        $lPackageLength = 18;
    }
    elseif ($weight <= 7)
    {
        $lPackageHeight = 42;
        $lPackageWidth = 32;
        $lPackageLength = 26;
    }
    elseif ($weight <= 9)
    {
        $lPackageHeight = 44;
        $lPackageWidth = 42;
        $lPackageLength = 31;
    }
    elseif ($weight < 10)
    {
        $lPackageHeight = 51;
        $lPackageWidth = 41;
        $lPackageLength = 31;
    }
    else
    {
        $lPackageHeight = 61;
        $lPackageWidth = 51;
        $lPackageLength = 41;
    }
    //overwrite the length, width and height if one is passed in GET
    if ((int) $_GET['length'] > 0)
    {
        $lPackageLength = ($_GET['length'] > 105) ? 105 : $_GET['length'];
    }
    if ((int) $_GET['width'] > 0)
    {
        $lPackageWidth = ($_GET['width'] > 105) ? 105 : $_GET['width'];
    }
    if ((int) $_GET['height'] > 0)
    {
        $lPackageHeight = ($_GET['height'] > 105) ? 105 : $_GET['height'];
    }
    //url to get data from
    $url = '/postage/parcel/domestic/calculate.json?from_postcode='.$_GET['from_postcode'].'&to_postcode='.$_GET['to_postcode'].'&length='.$lPackageLength.'&width='.$lPackageWidth.'&height='.$lPackageHeight.'&weight='.$weight.'&service_code='.$code;
}
//International shipping cost
if ($_GET['country_code'] != 'AU')
{
    $url = '/postage/parcel/international/calculate.json?country_code='.$_GET['country_code'].'&weight='.$_GET['weight'].'&service_code='.$code;
}
//create the hash
$hash = strtolower($_GET['country_code'].$_GET['from_postcode'].$_GET['to_postcode'].$_GET['weight'].$_GET['code'].$lPackageLength.$lPackageWidth.$lPackageHeight);
$hash = strtolower(md5($hash));
//find out if we have the shipping data already
mysqli_query($mysqli, "DELETE FROM `postoffice_shipping` WHERE stamp < ".strtotime("-60 days"));
$limit = strtotime("-3 hours");
include '../db.php';
$query = mysqli_query($mysqli, "SELECT * FROM `postoffice_shipping` WHERE `hash` = '$hash' AND stamp >= $limit ORDER BY `stamp` DESC LIMIT 1");
$localDataNum = mysqli_num_rows($query);
if ($localDataNum == 1)
{
    $data = mysqli_fetch_array($query);
    $output = '{"postage_result":{"service":"'.$data['service_name'].'","total_cost":"'.trim($data['shipping_fee']).'","costs":{"cost":{"item":"'.$data['service_name'].'","cost":"'.trim($data['shipping_fee']).'"}}}}';
}
//we don't have the data so ask the post office
if ($localDataNum == 0 || $weight > 19)
{
    $output = call($url);
}
$service = json_decode($output);
$shipping = [];
$shipping[$code] = ['code' => trim($code), 'price' => trim($service->postage_result->total_cost)];
//if price is 0, return $35 as fee as per client request
if (number_format($shipping[$code]['price'], 2, '.', '') <= 0)
{
    $shipping[$code]['price'] = 35;
}
if ($_GET['shippingOnly'] != 'y')
{
    echo $shipping[$code]['code']."\n";
}
echo $shipping[$code]['price'];
//log the call for later debugging needs
if ($localDataNum == 0)
{
    $time = time();
    $_GET['to_postcode'] = addslashes($_GET['to_postcode']);
    $_GET['from_postcode'] = addslashes($_GET['from_postcode']);
    $_GET['country_code'] = addslashes($_GET['country_code']);
    $_GET['weight'] = addslashes($_GET['weight']);
    $code = addslashes($code);
    $shipping[$code]['price'] = number_format($shipping[$code]['price'], 2, '.', '');
    $service_name = trim($service->postage_result->service);
    mysqli_query($mysqli, "INSERT INTO `postoffice_shipping` (`from_postcode`, `to_postcode`, `to_country`, `weight`, `service_name`, `service_code`, `shipping_fee`, `stamp`, `hash`) VALUES ('{$_GET['from_postcode']}', '{$_GET['to_postcode']}', '{$_GET['country_code']}', '{$_GET['weight']}', '$service_name', '$code', '{$shipping[$code]['price']}', '$time', '$hash')");
}
//debug output
if ($_GET['debug'] == 'y' && $localDataNum == 0)
{
    echo '<br>https://digitalapi.auspost.com.au'.$url;
    echo '<pre>';
    echo 'Parsed - ';
    print_r($shipping);
    echo '<hr>Unedited - ';
    print_r($service);
}
if ($_GET['debug'] == 'y' && $localDataNum == 1)
{
    echo '<br>Local source';
    echo '<pre>';
    print_r($shipping);
    echo '<hr>Unedited - ';
    print_r($service);
}
