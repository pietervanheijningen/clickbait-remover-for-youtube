<?php

function getMillisecondTime()
{
    return round(microtime(true) * 1000);
}

function curlReq($videoid)
{
    $ytApiKey = '';

    $response = json_decode(file_get_contents("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=$videoid&key=$ytApiKey"),
        true);

    return $response['items'][0]['snippet']['channelId'];
}

$startTime = getMillisecondTime();
$noRedirectToken = 'zctf420otaqimwn9lx8m';

$dontReplaceChannelIds = [
    'UC_E4px0RST-qFwXLJWBav8Q', //business casual
    'UCXuqSBlHAE6Xw-yeJA0Tunw' //ltt
];

$videoid = str_replace('https://i.ytimg.com/vi/', '',
    preg_replace(
        '/\/hqdefault.*/',
        '',
        $_GET['url']
    )
);

$internalReqTimeStart = getMillisecondTime();
$channelId = curlReq($videoid);
$internalReqTime = getMillisecondTime() - $internalReqTimeStart;

if (in_array($channelId, $dontReplaceChannelIds)) {
    $responseTime = getMillisecondTime() - $startTime;
    header("X-Thumbnail-Url: {$_GET['url']}&noRedirectToken=$noRedirectToken&responseTime=$responseTime&time2=$internalReqTime");
} else {
    $newURL = preg_replace('/(hqdefault|mqdefault)/', $_GET['preferredThumbnailFile'], $_GET['url']);

    $responseTime = getMillisecondTime() - $startTime;
    header("X-Thumbnail-Url: $newURL&noRedirectToken=$noRedirectToken&responseTime=$responseTime&time2=$internalReqTime");
}
