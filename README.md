# TheGabebook

**TheGabebook** is a social platform made using vanilla HTML, CSS, JavaScript, Node/Express.js, [MVC](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), [RESTful](https://en.wikipedia.org/wiki/REST) design, and [AWS](https://en.wikipedia.org/wiki/Amazon_Web_Services) hosting.

It includes profiles, posting, friendships, messaging, commenting, liking, and notifications.

<p align="center">
  <img src="./readmeimages/TheGabebook.png" width="80%" />
</p>

---

## MVC Architecture

MVC was used to keep the project organized, modular, and extensible through a clear separation of concerns. Node/Express.js makes it easy to create routes, controllers, and models to support this design.

<p align="center">
  <img src="./readmeimages/MVC.drawio.png" width="90%" />
</p>

---

## Example: Liking a Post

| Client (View) | Server (Controller) |
|---------------|--------------------|
| On the client side, the post view includes a like button that sends a request to the endpoint. <br><br> ![](./readmeimages/likePostUI.png)<br>![](./readmeimages/likePostEventHandler.png) | The Express router maps the endpoint to a controller method, which interacts with models. <br><br> ![](./readmeimages/likePostRouter.png)<br>![](./readmeimages/likePostController.png) |

---

### Updating the UI

Once the response is received, the client updates the view by modifying [DOM](https://en.wikipedia.org/wiki/Document_Object_Model) elements.

<p align="center">
  <img src="./readmeimages/unlikePostUI.png" width="70%" />
</p>

---

## Controllers and Models

Controllers are not restricted to a single model. For example, the `LikesController` uses both `LikesModel` and `PostModel`.

Model methods are intentionally simple and reusable, improving extensibility.

<p align="center">
  <img src="./readmeimages/model1.png" width="500" />
  <br>
  <img src="./readmeimages/model2.png" width="500" />
</p>

---

## Additional Features

Most user-facing features (profiles, posts, comments, etc.) follow the same MVC pattern.

<p align="center">
  <img src="./readmeimages/profile.png" width="80%" />
</p>

---

## Authentication

Session-based authentication is implemented using [express-session](https://expressjs.com/en/resources/middleware/session.html).

- Users receive a session cookie on login
- Server validates requests using session data

| | |
|--|--|
| ![](./readmeimages/sessionMiddleWare.png) | ![](./readmeimages/session.drawio.png) |

You can identify a user on the server via:

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

Applied to routes:

<p align="center">
  <img src="./readmeimages/friendshipmiddlewareroute.png" width="70%" />
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

Validation occurs before controller logic:

<p align="center">
  <img src="./readmeimages/likePostRouterFull.png" width="70%" />
</p>

---

### Additional Protections

| SQL Injection | XSS |
|--------------|-----|
| Parameterized queries prevent query manipulation. <br><br> ![](./readmeimages/model2.png) | The [xss](https://www.npmjs.com/package/xss?activeTab=dependents) package sanitizes input. <br><br> ![](./readmeimages/xss.png) |

---

## Real-Time Features

Real-time behavior is implemented using WebSockets via [Socket.io](https://socket.io/).

- Enables live notifications and messaging
- Separate from MVC request/response flow
- Offline users receive updates on next login

### Messaging Example

<p align="center">
  <img src="./readmeimages/websocket.drawio.png" width="80%" />
  <br><br>
  <img src="./readmeimages/msg-final.gif" width="70%" />
</p>