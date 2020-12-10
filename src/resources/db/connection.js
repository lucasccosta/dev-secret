const mongoose = require('mongoose')

let conn = null
const URI = 'mongodb+srv://secret:ba3BNhD67E34Gyzj@cluster0.upzbq.mongodb.net/secret?retryWrites=true&w=majority'

// pass: ba3BNhD67E34Gyzj

module.exports = async () => {
  if (!conn) {
    conn = mongoose.connect(URI, {
      useNewUrlParser: true,
      useCreateIndex: true

    })
    await conn
  }
}