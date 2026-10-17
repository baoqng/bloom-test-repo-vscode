// bloom-deps:

export interface OptionDef {
  type: 'string' | 'number' | 'boolean';
  alias?: string;
  default?: unknown;
  required?: boolean;
  description?: string;
}

export interface ParsedArgs {
  options: Record<string, string | number | boolean>;
  positional: string[];
  subcommand?: string;
}

export class CommandParser {
  private options: Map<string, OptionDef> = new Map();
  private aliases: Map<string, string> = new Map();
  private subcommands: Map<string, CommandParser> = new Map();

  constructor(
    private name: string,
    private description?: string
  ) {}

  addOption(name: string, def: OptionDef): this {
    if (this.options.has(name)) {
      throw new Error(`option already registered: --${name}`);
    }

    if (def.alias) {
      if (this.aliases.has(def.alias)) {
        throw new Error(`alias conflict: -${def.alias} is already registered`);
      }
      this.aliases.set(def.alias, name);
    }

    this.options.set(name, def);
    return this;
  }

  addSubcommand(name: string, parser: CommandParser): this {
    this.subcommands.set(name, parser);
    return this;
  }

  parse(argv: string[]): ParsedArgs {
    const options: Record<string, string | number | boolean> = {};
    const positional: string[] = [];
    let subcommand: string | undefined;

    // Initialize defaults
    for (const [name, def] of this.options) {
      if (def.default !== undefined) {
        options[name] = def.default;
      }
    }

    // Check for subcommand at argv[0]
    if (argv.length > 0 && this.subcommands.has(argv[0])) {
      subcommand = argv[0];
      const subparser = this.subcommands.get(argv[0])!;
      const subResult = subparser.parse(argv.slice(1));
      return {
        options: subResult.options,
        positional: subResult.positional,
        subcommand,
      };
    }

    let i = 0;
    let doubleDashEncountered = false;

    while (i < argv.length) {
      const arg = argv[i];

      if (doubleDashEncountered) {
        positional.push(arg);
        i++;
        continue;
      }

      if (arg === '--') {
        doubleDashEncountered = true;
        i++;
        continue;
      }

      if (arg.startsWith('--')) {
        const eqIdx = arg.indexOf('=');
        let optName: string;
        let optValue: string | undefined;

        if (eqIdx !== -1) {
          optName = arg.slice(2, eqIdx);
          optValue = arg.slice(eqIdx + 1);
        } else {
          optName = arg.slice(2);
        }

        // Handle --no-flag for booleans
        if (optName.startsWith('no-')) {
          const baseName = optName.slice(3);
          if (this.options.has(baseName)) {
            const def = this.options.get(baseName)!;
            if (def.type !== 'boolean') {
              throw new Error(`unknown option: --${optName}`);
            }
            options[baseName] = false;
            i++;
            continue;
          }
        }

        if (!this.options.has(optName)) {
          throw new Error(`unknown option: --${optName}`);
        }

        const def = this.options.get(optName)!;

        if (def.type === 'boolean') {
          options[optName] = true;
          i++;
        } else {
          if (optValue === undefined) {
            if (i + 1 >= argv.length) {
              throw new Error(`missing value for option: --${optName}`);
            }
            optValue = argv[i + 1];
            i += 2;
          } else {
            i++;
          }

          if (def.type === 'number') {
            const num = Number(optValue);
            if (isNaN(num)) {
              throw new Error(`invalid number for option --${optName}: ${optValue}`);
            }
            options[optName] = num;
          } else {
            options[optName] = optValue;
          }
        }
      } else if (arg.startsWith('-') && arg.length > 1 && arg !== '-') {
        const alias = arg.slice(1);
        if (!this.aliases.has(alias)) {
          throw new Error(`unknown option: -${alias}`);
        }

        const optName = this.aliases.get(alias)!;
        const def = this.options.get(optName)!;

        if (def.type === 'boolean') {
          options[optName] = true;
          i++;
        } else {
          if (i + 1 >= argv.length) {
            throw new Error(`missing value for option: -${alias}`);
          }
          const optValue = argv[i + 1];
          i += 2;

          if (def.type === 'number') {
            const num = Number(optValue);
            if (isNaN(num)) {
              throw new Error(`invalid number for option -${alias}: ${optValue}`);
            }
            options[optName] = num;
          } else {
            options[optName] = optValue;
          }
        }
      } else {
        positional.push(arg);
        i++;
      }
    }

    // Validate required options
    for (const [name, def] of this.options) {
      if (def.required && options[name] === undefined) {
        throw new Error(`missing required option: --${name}`);
      }
    }

    return {
      options,
      positional,
    };
  }
}