import 'dotenv/config';
import axios from 'axios';



export async function getSpringAuthToken() : Promise<string> {
  if (!process.env.SPRING_AUTH_TOKEN_ADDRESS) {
    throw new Error('SPRING_AUTH_TOKEN_ADDRESS is not defined in .env file');
  }
  const response = await axios.post(process.env.SPRING_AUTH_TOKEN_ADDRESS)
  return response.data.accessToken;
}