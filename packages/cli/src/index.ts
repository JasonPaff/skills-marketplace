import { Command } from 'commander';

import { installCommand } from './commands/install.js';

const program = new Command()
  .name('detergent-skills')
  .description('Detergent Skills Marketplace CLI')
  .version('0.1.0');

program.addCommand(installCommand);

program.parse();
