const express = require('express');
const router = express.Router();
const axios = require('axios');

// Daftar tanda tangan dan pola backdoor dengan keterangan
const backdoorSignatures = [
    { pattern: 'eval(base64_decode(', description: 'Kemungkinan PHP shell dengan base64_decode' },
    { pattern: 'preg_replace(\'/.*/e', description: 'Kemungkinan PHP shell dengan preg_replace' },
    { pattern: 'system($_GET[\'cmd\']);', description: 'Kemungkinan PHP shell dengan system()' },
    { pattern: 'exec($_POST[\'cmd\']);', description: 'Kemungkinan PHP shell dengan exec()' },
    { pattern: 'shell_exec($_POST[\'cmd\']);', description: 'Kemungkinan PHP shell dengan shell_exec()' },
    { pattern: 'passthru($_GET[\'cmd\']);', description: 'Kemungkinan PHP shell dengan passthru()' },
    { pattern: 'assert($_POST[\'code\']);', description: 'Kemungkinan PHP shell dengan assert()' },
    { pattern: 'eval(gzinflate(base64_decode(', description: 'Kemungkinan PHP shell dengan gzinflate dan base64_decode' },
    { pattern: 'assert(base64_decode(', description: 'Kemungkinan PHP shell dengan base64_decode' },
    { pattern: 'eval(gzuncompress(base64_decode(', description: 'Kemungkinan PHP shell dengan gzuncompress dan base64_decode' },
    { pattern: 'include($_GET[\'file\']);', description: 'Kemungkinan PHP backdoor dengan include()' },
    { pattern: 'require($_POST[\'file\']);', description: 'Kemungkinan PHP backdoor dengan require()' },
    { pattern: 'file_get_contents($_POST[\'file\']);', description: 'Kemungkinan PHP backdoor dengan file_get_contents()' },
    { pattern: 'create_function(', description: 'Kemungkinan backdoor menggunakan create_function()' },
    { pattern: 'eval(substr(base64_decode(', description: 'Kemungkinan backdoor dengan base64_decode dan substr()' },
    { pattern: 'file_put_contents($_GET[\'file\'],', description: 'Kemungkinan backdoor dengan file_put_contents()' },
    { pattern: '<script>eval(unescape(\'%', description: 'Kemungkinan JavaScript backdoor dengan eval dan unescape' },
    { pattern: '<script>document.write(unescape(\'%', description: 'Kemungkinan JavaScript backdoor dengan document.write dan unescape' },
    { pattern: 'window.location="http://', description: 'Kemungkinan JavaScript backdoor dengan window.location' },
    { pattern: '<iframe src="http://', description: 'Kemungkinan JavaScript backdoor dengan iframe' },
    { pattern: 'document.write("<script src=', description: 'Kemungkinan JavaScript backdoor dengan document.write dan src' },
    { pattern: 'document.write("<img src=', description: 'Kemungkinan JavaScript backdoor dengan document.write dan img src' },
    { pattern: 'javascript:eval(', description: 'Kemungkinan JavaScript backdoor dengan eval' },
    { pattern: 'eval("document.cookie', description: 'Kemungkinan JavaScript backdoor dengan eval untuk cookies' },
    { pattern: 'eval("window.location', description: 'Kemungkinan JavaScript backdoor dengan eval untuk window.location' },
    { pattern: 'eval("fetch(', description: 'Kemungkinan JavaScript backdoor dengan fetch' },
    { pattern: 'eval("XMLHttpRequest(', description: 'Kemungkinan JavaScript backdoor dengan XMLHttpRequest' },
    { pattern: 'new Function(', description: 'Kemungkinan JavaScript backdoor dengan new Function' },
    { pattern: 'c99.php', description: 'File backdoor umum c99.php' },
    { pattern: 'r57.php', description: 'File backdoor umum r57.php' },
    { pattern: 'wso.php', description: 'File backdoor umum wso.php' },
    { pattern: 'b374k.php', description: 'File backdoor umum b374k.php' },
    { pattern: 'k2.php', description: 'File backdoor umum k2.php' },
    { pattern: 'gopher://', description: 'Kemungkinan backdoor dengan protokol gopher' },
    { pattern: 'data:text/html', description: 'Kemungkinan backdoor dengan data:text/html' },
    { pattern: 'base64_encode(', description: 'Kemungkinan backdoor dengan base64_encode' },
    { pattern: 'gzdeflate(', description: 'Kemungkinan backdoor dengan gzdeflate' },
    { pattern: 'hex2bin(', description: 'Kemungkinan backdoor dengan hex2bin' },
    { pattern: 'str_rot13(', description: 'Kemungkinan backdoor dengan str_rot13' },
    { pattern: 'Y0VkaG9wZXIuYXNzZXJ0', description: 'Kemungkinan backdoor dengan metadata yang di-encode' },
    { pattern: 'W2Jhc2U2NF9kZWNvZGVd', description: 'Kemungkinan backdoor dengan metadata yang di-encode' },
    { pattern: 'WVJWcmNnV0U=', description: 'Kemungkinan backdoor dengan metadata yang di-encode' },
    { pattern: '<script>document.write(String.fromCharCode(', description: 'Kemungkinan backdoor dengan document.write dan fromCharCode' },
    { pattern: 'eval(function(p,a,c,k,e,d)', description: 'Kemungkinan backdoor dengan eval dan obfuscation' },
    { pattern: 'document.getElementById("', description: 'Kemungkinan backdoor dengan getElementById' },
    { pattern: 'eval((function(p,a,c,k,e,d', description: 'Kemungkinan backdoor dengan eval dan obfuscation' },
    { pattern: 'btoa(', description: 'Kemungkinan backdoor dengan btoa' },
    { pattern: 'atob(', description: 'Kemungkinan backdoor dengan atob' },
    { pattern: 'decompress(', description: 'Kemungkinan backdoor dengan decompress' },
    { pattern: 'fsockopen(', description: 'Kemungkinan backdoor dengan fsockopen' },
    { pattern: 'curl_exec(', description: 'Kemungkinan backdoor dengan curl_exec' },
    { pattern: 'socket_create(', description: 'Kemungkinan backdoor dengan socket_create' },
    { pattern: 'popen(', description: 'Kemungkinan backdoor dengan popen' },
    { pattern: 'proc_open(', description: 'Kemungkinan backdoor dengan proc_open' },
    { pattern: 'mysqli_query(', description: 'Kemungkinan backdoor dengan mysqli_query' },
    { pattern: 'pdo->exec(', description: 'Kemungkinan backdoor dengan pdo->exec' },
    { pattern: 'ftp_put(', description: 'Kemungkinan backdoor dengan ftp_put' },
    { pattern: 'mail(', description: 'Kemungkinan backdoor dengan mail' },
    { pattern: 'fwrite(', description: 'Kemungkinan backdoor dengan fwrite' },
    { pattern: 'fopen(', description: 'Kemungkinan backdoor dengan fopen' },
    { pattern: 'readfile(', description: 'Kemungkinan backdoor dengan readfile' },
    { pattern: '.htaccess', description: 'File .htaccess yang mencurigakan' },
    { pattern: 'config.php', description: 'File konfigurasi yang mencurigakan' },
    { pattern: 'admin.php', description: 'File admin yang mencurigakan' },
    { pattern: 'login.php', description: 'File login yang mencurigakan' },
    { pattern: 'backdoor.php', description: 'File backdoor yang umum' },
    { pattern: 'shell.php', description: 'File shell yang umum' },
    { pattern: 'upload.php', description: 'File upload yang mencurigakan' },
    { pattern: 'test.php', description: 'File test yang mencurigakan' },
    { pattern: 'setup.php', description: 'File setup yang mencurigakan' },
    { pattern: 'include.php', description: 'File include yang mencurigakan' },
    { pattern: 'tmp.php', description: 'File tmp yang mencurigakan' },
    { pattern: 'upload', description: 'Direktori upload yang mencurigakan' },
    { pattern: 'session', description: 'Direktori session yang mencurigakan' },
];

router.post('/', async (req, res) => {
    const { url } = req.body;

    try {
        const response = await axios.get(url);
        const responseData = response.data;

        // Cek tanda tangan backdoor dan berikan keterangan
        let backdoorDetails = [];
        for (let signature of backdoorSignatures) {
            if (responseData.includes(signature.pattern)) {
                backdoorDetails.push(signature.description);
            }
        }

        const isBackdoor = backdoorDetails.length > 0;
        res.render('result', { url, isBackdoor, backdoorDetails, error: null });
    } catch (error) {
        res.render('result', { url, isBackdoor: false, backdoorDetails: [], error: error.message });
    }
});

module.exports = router;
