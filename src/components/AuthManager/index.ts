import { judgment } from "utils/axios";
import * as console from "console";

export class AuthManager {
  private token: string = "";
  private refreshToken: string = "";

  constructor() {}

  async getToken() {
    await this.checkToken()
  }

  private async checkToken() {
    const response = await judgment(this.token);
    console.log(response);
    return response.data
  }
}
