
<p align="center">
  <img width="128px" src="https://github.com/alinGmail/LiveMock/blob/main/img/icon_128x128@2x.png"  alt="logo"/>
</p>

<h1 align="center">
    LiveMock
</h1>
<h3 align="center">
  <a href="https://alingmail.github.io/LiveMockDoc/docs/intro">📚document</a>
</h3>
LiveMock is a comprehensive tool for API development and testing, offering mock data, request proxying, and logging, to streamline workflows and track traffic.



## 🎆 Preview
![image](https://github.com/alinGmail/LiveMock/blob/main/img/light1.png)
![image](https://github.com/alinGmail/LiveMock/blob/main/img/light2.png)
![image](https://github.com/alinGmail/LiveMock/blob/main/img/dark1.png)
![image](https://github.com/alinGmail/LiveMock/blob/main/img/dark2.png)

## 📦 features

* **Dynamic mocking** - Apply mock changes without restarting the server
* **Cross-platform** - Available as web, Windows, and Mac applications
* **api proxy support** Forward requests to actual API when needed
* **support mockjs** - Generate mock data with mockjs library
* **Logging and analytics** - Log requests/responses for analysis.

## 🚧 Installation


There are two versions of liveMock, one is a desktop application and the other is a web service. You can use either version, but I recommend using the desktop version.

### Installation of the desktop version
To install the desktop version, simply download from the [release page](https://github.com/alinGmail/LiveMock/releases). It supports both macOS and Windows operating systems.

### Installation of the web service version

#### 1.This project uses Yarn Workspaces, so you need to enable corepack.
```
corepack enable
```

#### 2.clone the project
```
git clone https://github.com/alinGmail/LiveMock.git
```

#### 3.install dependencies
```
cd LiveMock 
yarn install
```

> [!NOTE]
> If you are in China, you can set the ELECTRON_MIRROR environment variables to https://npmmirror.com/mirrors/electron/
>

#### 4.build the forntEnd code
```
yarn run web-build
```

#### 5.run the project
```
yarn run web-start
```
the server will running at http://localhost:9002 


## 📌Quick Start
After installing liveMock, you will be able to access the welcome page (a page to create a project). Simply input the project name and submit the form, and you will be redirected to the dashboard page.

### Creating an Expectation
An expectation consists of several matchers and an action. When a request matches all its matchers, the defined action will be taken, such as responding with a JSON.

To create an expectation, click the "Add Expectation" button. After that, you will see the newly created expectation in the list.

### Creating a Matcher
To create a matcher, click the "Add Matcher" button. Change the matcher to "path start_with /" to match all requests.

### Creating an Action
An action defines what the expectation will do. Currently, two actions are supported: custom response and proxy. 

To create an action, click the "Create Action" button. By default, the action type is set to custom response, but you can change it to proxy. Once the action is created, click on it and input the desired JSON string in the content field. It will be automatically saved.

### Starting the Project
On the top, you will find a green start button. Clicking it will start the project. Furthermore, ensure that your expectation is activated. You can then visit http://localhost:8088 to see the JSON response.

## 🧱document
### What is expectation
An expectation consists of several matchers and an action. When a request matches all its matchers, the defined action will be taken, such as responding with a JSON.

### How to create expectation
To create an expectation, goto the expectation list page and click the "Add Expectation" button. After that, you will see the newly created expectation in the list.

### property of an expectation
- `delay`: the delay time of the response,unit is ms.
- `priority`: the expectation has highter priority will matcher first.
- `activate`: if the expectation is inactivate, it will be skip when the request match.
- `matchers`: the matchers of the expectation, if the request match all matchers, the action of the expectation will take.
- `action`: the action of the expectation,current support two action. custom response and proxy.

### matchers
The matcher consists of three parts: type, comparator, and value. These three parts determine whether a request can be matched.
Now livemock supports five types, which are:
- `method`: the method of the request, such as GET, POST, PUT, etc.
- `path`: the path of the request, the path is start with `/`,like `/student/123`
- `header`: the headers of the request
- `query`: the parameters in the request URL
- `param`: the parameters in the request body

Here are some examples of matchers:
- `path START_WITH /book/`: matches all request paths that start with `/book/`.
- `query teacher_name CONTAINS tom`: matches all requests that have a `teacher_name` query parameter, and the value of the `teacher_name` query parameter contains "tom".
- `param teacher_name IS tom`: matches all requests that have a body, and the body has a `teacher_name` parameter,value is `tom`. For example, a request with a JSON body like the one below:
```json
{
  "teacher_name": "tom"
}
```

### action
there are two type of action:
- `custom response`: response some custom text or JSON to the request, you can also set the headers of the response
- `proxy`: make the request forward to another host.

You can customize the header of the response, both in custom response and proxy actions.

### request log
Livemock will record all requests that match an expectation as a JSON object and display them on the request log page. Below is an example of a recorded object:
```json
{
    "id": 100099, 
    "expectationId": "c26a2cef-8ac7-4ce4-8a4b-595c850488be", 
    "proxyInfo": {
      "isProxy": false,
      "proxyHost": null,
      "proxyPath": null
    }, 
    "req": {
        "body": { }, 
        "headers": {
            "host": "localhost:8088", 
            "connection": "keep-alive", 
            "cache-control": "max-age=0", 
            "upgrade-insecure-requests": "1", 
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36", 
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8,application/signed-exchange;v=b3;q=0.7", 
            "accept-encoding": "gzip, deflate, br"
        }, 
        "method": "GET", 
        "path": "/olkioi", 
        "requestDate": "2023-08-04T13:14:51.042Z"
    }, 
    "res": {
        "body": {
            "name": "John", 
            "age": 30, 
            "hobbies": [
                "reading", 
                "hiking", 
                "coding"
            ]
        }, 
        "duration": 0, 
        "headers": {
            "x-powered-by": "Express", 
            "content-type": "text/plain"
        }, 
        "rawBody": "{\"name\":\"John\",\"age\":30,\"hobbies\":[\"reading\",\"hiking\",\"coding\"]}", 
        "responseDate": "2023-08-04T13:14:51.042Z", 
        "status": 200, 
        "statusMessage": "OK"
    }, 
    "meta": {
        "revision": 1, 
        "created": 1691154891042, 
        "version": 0, 
        "updated": 1691154891042
    }, 
    "$loki": 95
}
```

On the request log page, there are predefined columns such as "Method," "Status," "Body," and "Root." You can also add custom columns with three customizable properties: name, path, and display type.

- `Name`: The name of the column, which is displayed in the table header.
- `Path`: Defines the value of the path of the request JSON object to show. For example, "req.method" uses the value of JSONObject.req.method to display in the table body.
- `Display type`: Defines how to display the value. You can display it as text or a JSON tree.

