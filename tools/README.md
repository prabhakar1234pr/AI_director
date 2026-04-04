# Tools

Python scripts that do the actual work. Each tool handles one specific task: an API call, a data transformation, a file operation, etc.

## Conventions

- **Self-contained**: Each script must run standalone from the CLI
- **Inputs**: Accept via command-line arguments (`argparse`) or stdin
- **Outputs**: Print results to stdout, or write files to `.tmp/`
- **Credentials**: Load from `.env` only — never hardcode secrets
- **Exit codes**: Use `0` for success, non-zero for failure

## Template

```python
import argparse
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    parser = argparse.ArgumentParser(description="What this tool does")
    parser.add_argument("--input", required=True, help="...")
    args = parser.parse_args()

    # Do the work here
    result = do_something(args.input)
    print(result)

if __name__ == "__main__":
    main()
```

## Running a tool

```bash
python tools/tool_name.py --input "value"
```
