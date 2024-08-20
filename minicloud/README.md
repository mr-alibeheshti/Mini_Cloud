minicloud
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/minicloud.svg)](https://npmjs.org/package/minicloud)
[![Downloads/week](https://img.shields.io/npm/dw/minicloud.svg)](https://npmjs.org/package/minicloud)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g minicloud
$ minicloud COMMAND
running command...
$ minicloud (--version)
minicloud/0.0.0 linux-x64 node-v18.20.4
$ minicloud --help [COMMAND]
USAGE
  $ minicloud COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`minicloud hello PERSON`](#minicloud-hello-person)
* [`minicloud hello world`](#minicloud-hello-world)
* [`minicloud help [COMMAND]`](#minicloud-help-command)
* [`minicloud plugins`](#minicloud-plugins)
* [`minicloud plugins add PLUGIN`](#minicloud-plugins-add-plugin)
* [`minicloud plugins:inspect PLUGIN...`](#minicloud-pluginsinspect-plugin)
* [`minicloud plugins install PLUGIN`](#minicloud-plugins-install-plugin)
* [`minicloud plugins link PATH`](#minicloud-plugins-link-path)
* [`minicloud plugins remove [PLUGIN]`](#minicloud-plugins-remove-plugin)
* [`minicloud plugins reset`](#minicloud-plugins-reset)
* [`minicloud plugins uninstall [PLUGIN]`](#minicloud-plugins-uninstall-plugin)
* [`minicloud plugins unlink [PLUGIN]`](#minicloud-plugins-unlink-plugin)
* [`minicloud plugins update`](#minicloud-plugins-update)

## `minicloud hello PERSON`

Say hello

```
USAGE
  $ minicloud hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ minicloud hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/test/minicloud/blob/v0.0.0/src/commands/hello/index.ts)_

## `minicloud hello world`

Say hello world

```
USAGE
  $ minicloud hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ minicloud hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/test/minicloud/blob/v0.0.0/src/commands/hello/world.ts)_

## `minicloud help [COMMAND]`

Display help for minicloud.

```
USAGE
  $ minicloud help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for minicloud.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.8/src/commands/help.ts)_

## `minicloud plugins`

List installed plugins.

```
USAGE
  $ minicloud plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ minicloud plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/index.ts)_

## `minicloud plugins add PLUGIN`

Installs a plugin into minicloud.

```
USAGE
  $ minicloud plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into minicloud.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the MINICLOUD_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the MINICLOUD_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ minicloud plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ minicloud plugins add myplugin

  Install a plugin from a github url.

    $ minicloud plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ minicloud plugins add someuser/someplugin
```

## `minicloud plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ minicloud plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ minicloud plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/inspect.ts)_

## `minicloud plugins install PLUGIN`

Installs a plugin into minicloud.

```
USAGE
  $ minicloud plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into minicloud.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the MINICLOUD_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the MINICLOUD_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ minicloud plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ minicloud plugins install myplugin

  Install a plugin from a github url.

    $ minicloud plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ minicloud plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/install.ts)_

## `minicloud plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ minicloud plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ minicloud plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/link.ts)_

## `minicloud plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ minicloud plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ minicloud plugins unlink
  $ minicloud plugins remove

EXAMPLES
  $ minicloud plugins remove myplugin
```

## `minicloud plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ minicloud plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/reset.ts)_

## `minicloud plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ minicloud plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ minicloud plugins unlink
  $ minicloud plugins remove

EXAMPLES
  $ minicloud plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/uninstall.ts)_

## `minicloud plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ minicloud plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ minicloud plugins unlink
  $ minicloud plugins remove

EXAMPLES
  $ minicloud plugins unlink myplugin
```

## `minicloud plugins update`

Update installed plugins.

```
USAGE
  $ minicloud plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.4/src/commands/plugins/update.ts)_
<!-- commandsstop -->
