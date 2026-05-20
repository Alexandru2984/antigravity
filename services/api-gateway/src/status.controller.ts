import { Controller, Get } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-status')
export class StatusController {
  @Get()
  async getStatus() {
    const SERVICES = [
      { name: 'Brainfuck', port: 4050, host: 'brainfuck-service' },
      { name: 'Assembly', port: 4051, host: 'assembly-service' },
      { name: 'COBOL', port: 4052, host: 'cobol-service' },
      { name: 'Clojure', port: 4053, host: 'clojure-service' },
      { name: 'Julia', port: 4054, host: 'julia-service' },
      { name: 'Prolog', port: 4055, host: 'prolog-service' },
      { name: 'Elixir', port: 4057, host: 'elixir-service' },
      { name: 'Scala', port: 4058, host: 'scala-service' },
      { name: 'Lua', port: 4059, host: 'lua-service' },
      { name: 'R', port: 4060, host: 'r-service' },
      { name: 'PHP', port: 4061, host: 'php-service' },
      { name: 'Zig', port: 4062, host: 'zig-service' },
      { name: 'Swift', port: 4063, host: 'swift-service' },
      { name: 'Nim', port: 4064, host: 'nim-service' },
      { name: 'Odin', port: 4065, host: 'odin-service' }
    ];

    return Promise.all(SERVICES.map(async (s) => {
      try {
        const start = Date.now();
        const res = await axios.get(`http://${s.host}:${s.port}`, { timeout: 1500 });
        return { name: s.name, port: s.port, status: 'online', latency: Date.now() - start, response: res.data };
      } catch (e) {
        return { name: s.name, port: s.port, status: 'offline' };
      }
    }));
  }
}
