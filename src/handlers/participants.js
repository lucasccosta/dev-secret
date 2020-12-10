const { v4: uuidv4 } = require('uuid')
const Secret = require('../resources/models/Secret')

require('../resources/db/connection')()

const SecretModel = require('../resources/models/Secret')

module.exports.create = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false // Quando se trabalha com mongoDB na aws, há uma boa prática que é utilizar essa função para que a lambda reutilize a conexão e não a feche-a toda hora

  const { id: secretId } = event.pathParameters
  const { name, email } = JSON.parse(event.body)
  const externalId = uuidv4()
  
  try {
    const result = await SecretModel.updateOne(
      {
        externalId: secretId,
        'participants.email': {$ne: email}
      },
      {
        $push: {
          participants:{
            externalId,
            name,
            email,
          }
        }
      }
    )  
    
    if(!result.nModified) {
      throw new Error()
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        id: externalId,
        adminKey,
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

module.exports.delete = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false // Quando se trabalha com mongoDB na aws, há uma boa prática que é utilizar essa função para que a lambda reutilize a conexão e não a feche-a toda hora

  const { id: secretId, participantsId } = event.pathParameters
  const adminKey = event.headers['admin-key']

  try {
    const result = await SecretModel.updateOne(
      {
        externalId: secretId,
        adminKey
      },
      {
        $pull: {
          participants: {
            externalId: participantsId,
          }
        }
      }
    )

    if (!result.nModified) {
      throw new Error()
    }
    
    return {
      statusCode: 204,
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
