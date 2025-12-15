import dotenv from 'dotenv'
import { app } from './app.js'
import connectDB from './db/index.js'

dotenv.config({path: './.env'})

connectDB()
.then(() => {
    app.on('error', (error) => {
        console.log(error);
        throw error
    })

    app.listen(process.env.PORT || 3000, () => {
        console.log(`Server is running at port ${process.env.PORT}`);
    })

})
.catch((error) => {
    console.log("Databse connection failed",error)
    process.exit(1) 
})