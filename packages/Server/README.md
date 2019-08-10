# `@housegeek/server`

> TODO: description

## Usage

```sh
npm i --save server
```

```js
const server = require('@housegeek/server')
const hostname = 'localhost'
const port = 8080

server.use((req, res, next) => {
    if (req.method === 'options') {
        return res.status(200).end()
    }
    next()
})

server.route('GET', 'hello/:name', (req, res, next) => {
    const { name } = req.params

    return res
        .setHeader('Content-Type', 'text/plain')
        .send(`Hello ${name}, I am ${hostname}:${port}`)
        .end()
})

server.listen(port)
```
