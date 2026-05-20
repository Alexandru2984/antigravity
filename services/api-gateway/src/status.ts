import axios from 'axios';

const SERVICES = [
  { name: 'Brainfuck', port: 4050 },
  { name: 'Assembly', port: 4051 },
  { name: 'COBOL', port: 4052 },
  { name: 'Clojure', port: 4053 },
  { name: 'Julia', port: 4054 },
  { name: 'Prolog', port: 4055 },
  { name: 'Elixir', port: 4057 },
  { name: 'Scala', port: 4058 },
  { name: 'Lua', port: 4059 },
  { name: 'R', port: 4060 },
  { name: 'PHP', port: 4061 },
  { name: 'Zig', port: 4062 },
  { name: 'Swift', port: 4063 },
  { name: 'Nim', port: 4064 },
  { name: 'Odin', port: 4065 }
];

export const getPolyglotStatus = async () => {
  const results = await Promise.all(SERVICES.map(async (s) => {
    try {
      const start = Date.now();
      const res = await axios.get(`http://${s.name.toLowerCase()}-service:${s.port}`, { timeout: 2000 });
      return { ...s, status: 'online', latency: Date.now() - start, response: res.data };
    } catch (e) {
      return { ...s, status: 'offline', response: null };
    }
  }));
  return results;
};
