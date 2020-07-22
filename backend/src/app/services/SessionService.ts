import UserRepository from '../repositories/sql/ClientRepository';
import User from '../models/User';
import { ApiError } from '../../config/ErrorHandler';
import constants from '../../config/constants';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authConfig from '../../config/auth';
import {
  SessionBody,
  ReturnBody,
} from '../controllers/Session/SessionController';
import Client from '../models/Client';

export default class UserService {
  repository: UserRepository = new UserRepository();

  public async checkPassword(password: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hash);
    return result;
  }

  public async login(entity: SessionBody): Promise<ReturnBody> {
    const { login, password } = entity;
    const user = await User.findOne({ where: { login } });

    if (!user) {
      throw new ApiError(constants.errorTypes.notFound);
    }

    const client = await Client.findOne({ where: { login_user: login } });

    if (!(await this.checkPassword(password, user.senha))) {
      throw new ApiError(constants.errorTypes.auth);
    }

    const { cpf, login_user, email } = client;

    return {
      user: { cpf, login: login_user, email, type_user: 'client' },
      token: jwt.sign(
        { codigo: String(client.cpf), scopes: ['client'] },
        authConfig.secret,
        {
          expiresIn: authConfig.expiresIn,
        }
      ),
    };
  }
}
