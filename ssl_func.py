from ssl_checker import SSLChecker

SSLChecker = SSLChecker()
args = {
    'hosts': ['google.com', 'cisco.com']
}

SSLChecker.show_result(SSLChecker.get_args(json_args=args))

