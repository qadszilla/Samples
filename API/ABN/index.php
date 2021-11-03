<?php
//validate api key
$apiKey = addslashes($_GET['api_key']);
include_once '../api/enforceKey.php';
//log the api request
$service = 'abn';
$apiData = $_GET;
include_once '../api/logger.php';
//process
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
include 'soap.php';
$abnlookup = new abnlookup();
$number = str_replace(" ", "", trim($_GET['number']));
$type = (isset($_GET['type'])) ? trim($_GET['type']) : '';
$result = $abnlookup->search($number, $type);
$full = $result;
$result = $result->ABRPayloadSearchResults->response->businessEntity201408;
//check results, if nothing then try searching for ACN
if (strtolower($result->entityStatus->entityStatusCode) != 'active')
{
    $retryType = ($type == 'ABN') ? 'ACN' : 'ABN';
    $result = $abnlookup->search($number, $retryType);
    $full = $result;
    $result = $result->ABRPayloadSearchResults->response->businessEntity201408;
}
//didn't find anything at all, error out
if (strtolower($result->entityStatus->entityStatusCode) != 'active')
{
    $data = [
        'error' => 'y',
        'msg' => trim($result->entityStatus->entityStatusCode)
    ];
    echo json_encode($data);
    die();
    exit;
}
//it is active, show details
$data = [
    'error' => 'n',
    'msg' => '',
    'status' => trim($result->entityStatus->entityStatusCode),
    'type' => trim($result->entityType->entityTypeCode),
    'description' => trim($result->entityType->entityDescription),
    'company' => trim($abnlookup->figureOutBusName($result))
];
echo json_encode($data);
