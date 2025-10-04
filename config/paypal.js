import axios from "axios"

const paypal={
    clientId:process.env.PAYPAL_CLIENT_ID,
    clientSecret:process.env.PAYPAL_SECRET,
    baseUrl:process.env.PAYPAL_BASE_URL
}

const getAccessToken=async()=>{
    try {
        console.log("PayPal Base URL:", paypal.baseUrl);

        const response=await axios.post(`${paypal.baseUrl}/v1/oauth2/token`,
            "grant_type=client_credentials",{
                auth:{
                    username:paypal.clientId,
                    password:paypal.clientSecret
                },
                headers:{
                    "Content-Type":"application/x-www-form-urlencoded"
                }
            }
        )
        return response.data.access_token;
    } catch (error) {
        console.log('Error in fetching access token : ', error.message);
        
    }
}

export default {
    paypal:paypal,
    getAccessToken:getAccessToken,
}