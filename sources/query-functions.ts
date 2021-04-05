import * as express from 'express'
import { Pool, PoolConfig } from 'pg'
import fetch from 'node-fetch'

type CustomPoolConfig = PoolConfig & { url: string }

const pool = new Pool({
  user: process.env['DB_USER'],
  host: process.env['DB_HOST'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  port: Number(process.env['DB_PORT']),
  url: process.env['DB_URL']
} as CustomPoolConfig)

function giveResponse(
  response: express.Response,
  status: 'success' | 'created' | 'bad_request' | 'not_found',
  data: any,
  info?: string
) {
  let statusCode: number

  if(status == 'success') {
    statusCode = 200
  } else if(status == 'created') {
    statusCode = 201
  } else if(status == 'bad_request') {
    statusCode = 400
  } else if(status == 'not_found') {
    statusCode = 404
  }

  response.status(statusCode!).json({
    status,
    info,
    data
  })
}

function registerRegid(req: express.Request, res: express.Response) {
  const { regid } = req.fields

  pool.query(
    'SELECT * FROM accounts WHERE regid=$1',
    [regid],
    (err, results) => {
      if(err) {
        giveResponse(res, 'bad_request', {}, `${err.name} : ${err.message}`)

        return
      }

      if (results.rows.length > 0) {
        giveResponse(res, 'bad_request', {}, 'regid sudah terdaftar')

        return
      }

      pool.query(
        `INSERT INTO accounts (regid) VALUES ($1);`,
        [regid],
        (err, results) => {
          if(err) {
            giveResponse(res, 'bad_request', {}, `${err.name} : ${err.message}`)
    
            return
          }
    
          giveResponse(res, 'success', {}, 'Sukses mendaftarkan regid')
        }
      )
    }
  )
}

function getAllRegid(req: express.Request, res: express.Response) {
  pool.query(
    'SELECT * FROM accounts',
    [],
    (err, results) => {
      if(err) {
        giveResponse(res, 'bad_request', [], `${err.name} : ${err.message}`)

        return
      }

      giveResponse(res, 'success', results.rows, 'Sukses mendapatkan semua regid')
    }
  )
}

function sendNotification(req: express.Request, res: express.Response) {
  const { regid } = req.fields

  pool.query(
    `SELECT * FROM accounts WHERE regid='${regid}';`,
    [],
    (err, results) => {
      if(err) {
        giveResponse(res, 'bad_request', {}, `${err.name} : ${err.message}`)

        return
      }

      if (results.rows.length == 0) {
        giveResponse(res, 'not_found', {}, 'Tidak ditemukan regid yang dimaksud')

        return
      }

      fetch(
        'https://fcm.googleapis.com/fcm/send',
        {
          method: 'POST',
          headers: {
            Authorization: `key=${process.env['FIREBASE_AUTHORIZATION_KEY']}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification : {
              title : 'Notif baru',
              body : 'Ini body notif'
            },
            data: {
              title : 'Notif baru',
              body: 'Ini content notif'
            },
            to: regid
          })
        }
      )
      .then(res => res.json())
      .then(resJSON => {
        giveResponse(res, 'success', resJSON, 'Sukses mengirimkan notifikasi')
      })
      .catch(error => {
        giveResponse(res, 'bad_request', {}, 'Gagal mengirimkan notifikasi')
      })
    }
  )
}

export default {
  registerRegid,
  getAllRegid,
  sendNotification
}