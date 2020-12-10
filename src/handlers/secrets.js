const { v4: uuidv4 } = require('uuid')

require('../resources/db/connection')()

const SecretModel = require('../resources/models/Secret')
const draw = require('../utils/draw')

module.exports.create = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false // Quando se trabalha com mongoDB na aws, há uma boa prática que é utilizar essa função para que a lambda reutilize a conexão e não a feche-a toda hora
  
  const { name, email } = JSON.parse(event.body) // O event é o objeto que a lambda vai receber, só que esse body vem como String, como enviamos um JSON na api, precisamos parsear pra JSON
  const externalId = uuidv4();
  const adminKey = uuidv4()


  try {
    await SecretModel.create({
      owner: name,
      ownerEmail: email,
      externalId,
      adminKey,
    })

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        id: externalId,
        adminKey,
      }),
    }
    
  } catch (error) {
    // console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        // lembrando que agora ele está como objeto JSON, já que estamos retornando-o tempos que passá-lo em forma de string
        success: false
      })
    }
  }
}

module.exports.get = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false // Quando se trabalha com mongoDB na aws, há uma boa prática que é utilizar essa função para que a lambda reutilize a conexão e não a feche-a toda hora

  const { id: externalId } = event.pathParameters
  const incomingAdminKey = event.headers['admin-key']

  try {
    const { participants, adminKey, drawResult } = await SecretModel.findOne({
      externalId,
    }).select('-id participants adminKey drawResult').lean()  
    
    const isAdmin = !!(incomingAdminKey && incomingAdminKey === adminKey)

    const result = {
      participants,
      hasDrew: !!drawResult.length, // drawResult vai ser um array vazio, como estamos passando ele pra booleano com a operação !!(...), se for 0 - false, se não, true
      isAdmin,
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    }
    
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({  // lembrando que agora ele está como objeto JSON, já que estamos retornando-o tempos que passá-lo em forma de string
        success: false
      })
    }
  }
}

module.exports.draw = async (event) => {
  context.callbackWaitsForEmptyEventLoop = false // Quando se trabalha com mongoDB na aws, há uma boa prática que é utilizar essa função para que a lambda reutilize a conexão e não a feche-a toda hora

    const { id: externalId } = event.pathParameters
    const adminKey = event.headers['admin-key']

  try {
    const secret = await SecretModel.findOne({
      externalId,
      adminKey,
    }).select('participants ownerEmail').lean()
    

    if (!secret){
      throw new Error()
    }
    
    const drawResult= draw(secret.participants)
    const drawMap = drawResult.map((result) => {
      return{
        giver: result.giver.externalId,
        receiver: result.receiver.externalId
      }
    })

    
    await SecretModel.updateOne(
      {
        _id: secret.id
      },
      {
        drawResult: drawMap,
      }
      )
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          succes: true,
        })
      }

  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: JSON.stringify({  // lembrando que agora ele está como objeto JSON, já que estamos retornando-o tempos que passá-lo em forma de string
        success: false
      })
    }
  }
}