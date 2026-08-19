# graft-opencode
Extra tools to use https://github.com/NanoNets/Graft within [OpenCode](https://opencode.ai/).

## Usage
Copy folder `.opencode` in your repository, it will put the tools/plugins etc. in the right place.

On Linux or macOS you can use rsync (skips up-to-date files):

```bash
cd graft-opencode  # this folder
rsync -avu .opencode/ /path/to/destination/.opencode/
```

---

> Note: OpenCode auto-discovers project plugins from either `.opencode/plugin/` **or**
> `.opencode/plugins/` (both are scanned, no config entry needed). See the
> [OpenCode plugin docs](https://opencode.ai/docs/plugins/) for details.
