# Tour_For_All Backend

This is the Express backend for Tour for all.

To run this:

    node server.js
    
To run the tests:

    jest -i



## API Reference

### Authorization
#### Login
Returns JWT token which can be used to authenticate further requests.

```http
  POST /auth/token
```
##### Request **JSON Body**
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `username` | `string` | **Required**. Your username |
| `password` | `string` | **Required**. Your password |

```json
{
    "username":"admin", 
    "password":"123456"
}
```

##### **Response**

if successfully login

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6MSwiaWF0IjoxNjI0NjI2NTM2fQ.rLAQZdIYJ_b_GYS1oxWsnR2VOvdloO_V-8gjB_ejh4k"
}
```

else 

```json
{
    "error": {
        "message": "Invalid username/password",
        "status": 401
    }
}
```

#### Register
Returns JWT token which can be used to authenticate further requests.

```http
  POST /auth/register
```
##### Body Parameters
| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `username` | `string` | **Required**. Your username |
| `password` | `string` | **Required**. Your password |
| `firstName` | `string` | **Required**. Your first name |
| `lastName` | `string` | **Required**. Your last name |
| `email` | `string` | **Required**. Your email |

#### add(num1, num2)

Takes two numbers and returns the sum.

  