# `@housegeek/server`

> TODO: description

## Usage

```sh
npm i --save @housegeek/server
```

```js
const { Server } = require('@housegeek/server')
const server = new Server()
const hostname = 'localhost'
const port = 8080

server.use((req, res, next) => {
    if (req.method === 'options') {
        return res.status(200).end()
    }
    next()
})

server.route('hello/:name', 'GET', (req, res, next) => {
    const { name } = req.params

    return res
        .setHeader('Content-Type', 'text/plain')
        .send(`Hello ${name}, I am ${hostname}:${port}`)
        .end()
})

server.listen(port)
```
