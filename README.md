# TheGabebook

**TheGabebook** is a social platform built with vanilla HTML, CSS, JavaScript, Node/Express.js, [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) architecture, [RESTful](https://en.wikipedia.org/wiki/REST) APIs, and [AWS](https://en.wikipedia.org/wiki/Amazon_Web_Services) hosting.

It includes profiles, posting, friendships, messaging, commenting, liking, and notifications.

<p align="center">
  <img src="./readmeimages/TheGabebook.png" width="80%" />
</p>

---

## MVC Architecture

MVC was used to keep the project organized, modular, and extensible through a clear separation of concerns. Node/Express.js makes it easy to create routes, controllers, and models to support this design.

<p align="center">
  <img src="./readmeimages/MVC.png" width="100%" />
</p>

---

## Example: Liking a Post

The `/likePost` API is triggered by a client-side UI interaction:
<p align="center">
  <img src="./readmeimages/likepostui.png" width="70%" />
</p>

| Client (View) | Server (Controller) |
|---------------|--------------------|
| On the client side, the post view includes a like button that sends a request to the endpoint. <br><br> ![](./readmeimages/likePostUI.png)<br>![](./readmeimages/likePostEventHandler.png) | The Express router maps the endpoint to a controller method, which interacts with models. <br><br> ![](./readmeimages/likePostRouter.png)<br>![](./readmeimages/likePostController.png) |

Once the response is received, the client updates the view by modifying [DOM](https://en.wikipedia.org/wiki/Document_Object_Model) elements.

<p align="center">
  <img src="./readmeimages/unlikePostUI.png" width="70%" />
</p>

---

## Model Design

Controllers are not limited to a single model. For example, the `LikesController's` `handleLikePost` uses both the `LikesModel` and `PostModel`. Model methods are kept intentionally simple and reusable to improve extensibility.

<p align="center">
  <img src="./readmeimages/model1.png" width="600" />
  <br>
  <img src="./readmeimages/model2.png" width="600" />
</p>

---

## Additional MVC Examples

Most user-facing features (profiles, posts, comments, etc.) follow the same MVC pattern.

<p align="center">
  <img src="./readmeimages/profile.png" width="80%" />
</p>

---

## Authentication

Session-based authentication is implemented using the [express-session](https://expressjs.com/en/resources/middleware/session.html) middleware.

<p align="center">
  <img src="./readmeimages/session.png" width="100%" />
</p>

This allows for easy identification of users during requests:

<p align="center">
  <img src="./readmeimages/req.session.userId.png" width="60%" />
</p>

---

## Authorization

Authorization is enforced using a friendship check before processing inter-user requests. This is implemented as reusable middleware.

### validateFriendship middleware

<p align="center">
  <img src="./readmeimages/friendshipmiddleware.png" width="70%" />
</p>

Middleware is applied to routes and runs before controllers, allowing early rejection of unauthorized requests

<p align="center">
  <img src="./readmeimages/friendshipmiddlewareroute.png" width="100%" />
</p>

---

## Security

### CSRF Protection

Implemented using [csurf](https://www.npmjs.com/package/csurf) middleware.

- Stores a per-client secret in a cookie
- Requires a token for POST requests

<p align="center">
  <img src="./readmeimages/csurf.png" width="70%" />
</p>

| Token Issuance | Token Usage |
|----------------|-------------|
| ![](./readmeimages/csurfget.png) | ![](./readmeimages/csrflike.png) |

<p align="center">
  <img src="./readmeimages/likePostRouterFull.png" width="100%" />
</p>

---

### Additional Protections

| SQL Injection | XSS |
|--------------|-----|
| Parameterized queries prevent query manipulation. <br><br> ![](./readmeimages/model2.png) | The [xss](https://www.npmjs.com/package/xss?activeTab=dependents) package sanitizes input. <br><br> ![](./readmeimages/xss.png) |

---

## Real-Time Features

Real-time notifications and messaging are implemented using WebSockets via [Socket.io](https://socket.io/).

### Messaging Example

<p align="center">
  <img src="./readmeimages/msg-final.gif" width="80%" />
</p>