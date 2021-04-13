import * as argparse from "argparse"
import { checkConfig } from "./check-config"
import { build } from "./build"
import { develop } from "./develop"
import { serve } from "./serve"
import { stage } from "./stage"
import { Command, Args, Environment } from "./types"

// TODO - We should add some tests for pure functions in here for a bit more
// confidence.

const getParser = async (): Promise<argparse.ArgumentParser> => {
  const parser = new argparse.ArgumentParser({
    version: "1.0",
    addHelp: true,
    description: "Scripts for managing ga-dev-tools development.",
  })

  const subparsers = parser.addSubparsers({
    title: "Sub command",
    dest: "cmd",
  })

  const checkConfigParser = subparsers.addParser(Command.CheckConfig, {
    help:
      "Ensures that all necessary configuration files exist & have required values.",
  })
  checkConfigParser.addArgument("--all", {
    defaultValue: false,
    dest: "all",
    action: "storeTrue",
  })

  const buildParser = subparsers.addParser(Command.Build, {
    help: "Builds the project. Runs any necessary validation before building.",
  })

  // TODO - It's probably worth implementing a workaround so this can be built
  // using the development environment variables. Right now, this works great
  // for local development, but it's less useful for the staging site.
  const deployParser = subparsers.addParser(Command.Deploy, {
    help:
      "Builds the project and deploys it to `--environment`. Note that due to a limitation in `gatsby build`, this will always use the production environment variables. Only the firebase projectId will be changed",
  })

  deployParser.addArgument("--no-localhost", {
    defaultValue: false,
    dest: "noLocalhost",
    action: "storeTrue",
  })

  subparsers.addParser(Command.Develop, {
    help:
      "Runs a local dev server. Runs any necessary validation before serving.",
  })

  const serveParser = subparsers.addParser(Command.Serve, {
    help:
      "Serves the content in the build directory locally through the Firebase cli.",
  })
  serveParser.addArgument("--skip_build", {
    defaultValue: false,
    dest: "skipBuild",
    action: "storeTrue",
  })

  // Add the environment argument to all commands that support it.
  ;[buildParser, serveParser, deployParser].forEach(parser => {
    parser.addArgument("--environment", {
      required: true,
      dest: "environment",
      choices: Object.values(Environment),
    })
  })

  return parser
}

const scripts = async () => {
  const parser = await getParser()
  const args = parser.parseArgs() as Args

  switch (args.cmd) {
    case Command.CheckConfig: {
      await checkConfig(args)
      break
    }
    case Command.Build: {
      await build()
      break
    }
    case Command.Develop: {
      await develop()
      break
    }
    case Command.Serve: {
      await serve(args)
      break
    }
    case Command.Deploy: {
      await stage(args)
      break
    }
  }

  process.exit(0)
}

scripts()
