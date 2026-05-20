import { Controller, Post, Body } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-compute')
export class ComputeController {
  @Post()
  async runPipeline(@Body() body: { data: number[] }) {
    const results: any[] = []; // Explicit type to avoid 'never[]'

    try {
      // Pasul 1: Julia pentru Statistici
      const juliaRes = await axios.post('http://julia-service:4054', { data: body.data });
      results.push({ service: 'Julia', action: 'Statistical Analysis', data: juliaRes.data });

      // Pasul 2: Python pentru Recomandări
      const pythonRes = await axios.get('http://ml-service:4021/recommend');
      results.push({ service: 'Python', action: 'ML Inference', data: pythonRes.data });

      // Pasul 3: Prolog pentru Validare
      const prologRes = await axios.post('http://prolog-service:4055/check_fraud', { 
        price: juliaRes.data.mean || 0, 
        category: 'electronics' 
      });
      results.push({ service: 'Prolog', action: 'Logic Rule Validation', data: prologRes.data });

      return { 
        status: 'Success', 
        finalStatus: prologRes.data.status === 'ok' ? 'APPROVED' : 'REJECTED',
        steps: results 
      };
    } catch (e) {
      return { status: 'Error', message: e.message };
    }
  }
}
