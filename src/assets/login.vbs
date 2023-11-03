Dim code, httpClient
' code = InputBox("Please input verification code from WeChatEnterprise or Outlook mailbox", "Login")
code = InputBox("请输入登录验证码（检查您的企业微信或Outlook邮箱）", "百业灵犀后台接口登录")
Set httpClient = CreateObject("MSXML2.XMLHTTP.3.0")
Call httpClient.Open("POST", "http://localhost:3000/auth/login", False)
Call httpClient.setRequestHeader("Content-Type", "application/json")
Call httpClient.send("{""code"": """ & code &"""}")
Call WScript.Echo(httpClient.responseText)