import { Command } from 'commander';

import { installCommand } from './commands/install.js';

const program = new Command()
  .name('emergent-skills')
  .description('Emergent Skills Marketplace CLI')
  .version('0.1.0');

program.addCommand(installCommand);

program.parse();
