import app from './src/app.js';
import { port } from './src/config/appConfig.js';

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
