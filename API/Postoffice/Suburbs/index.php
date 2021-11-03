<?php
//validate api key
$apiKey = addslashes($_GET['api_key']);
include_once '../api/enforceKey.php';
//log the api request
$service = 'postoffice postcode to suburb';
$_GET['location'] = addslashes($_SERVER['HTTP_REFERER']);
$apiData = json_encode($_GET);
include_once '../api/logger.php';
include_once '../db.php';
//put the query together
$postcode = trim($_GET['postcode']);
$state = trim($_GET['state']);
$state = (strlen($state) == 3) ? $state : '';
$stateSQL = (strlen($state) == 3) ? "AND `state` = '".addslashes($state)."'" : '';
$query = mysqli_query($mysqli, "SELECT `suburb`,`state` FROM `postcodes` WHERE `postcode` = '".addslashes($postcode)."' $stateSQL ORDER BY `suburb` ASC");
//check the database to see if we have the postcode data
$output = [];
if (mysqli_num_rows($query) > 0)
{
    while ($data = mysqli_fetch_array($query))
    {
        $output[] = [
            'suburb' => stripslashes($data['suburb']),
            'state' => trim($data['state'])
        ];
    }
}
else //we don't have the data, show an error message
{
    $output[] = [
        'error' => true,
        'message' => 'We don\'t have any suburb or state data for this postcode ('.$postcode.')'
    ];
}
//output
header('Content-Type: application/json');
echo json_encode($output);
