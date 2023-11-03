Dim code, httpClient
code = InputBox("Please input verification code from WeChatEnterprise or Outlook mailbox", "Login")
Set httpClient = CreateObject("MSXML2.XMLHTTP.3.0")
Call httpClient.Open("POST", "http://localhost:3000/auth/login", False)
Call httpClient.setRequestHeader("Content-Type", "application/json")
Call httpClient.send("{""code"": """ & code &"""}")
Call WScript.Echo(httpClient.responseText)