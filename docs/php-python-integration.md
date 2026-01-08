# PHP ↔ Python Integration Guide

Integrating PHP with Python can be done in several ways depending on your project’s needs — whether you want to run Python scripts from PHP, exchange data between them, or embed Python logic into a PHP web app.

Below are the most common and reliable methods with runnable examples.

## 1. Run Python from PHP with `exec()` / `shell_exec()`

This is the simplest way — PHP calls a Python script as an external process.

**PHP (index.php):**

```php
<?php
// Path to Python script
$pythonScript = escapeshellcmd('python3 myscript.py "Hello from PHP"');

// Execute and capture output
$output = shell_exec($pythonScript);

// Display result
if ($output === null) {
    echo "Error running Python script.";
} else {
    echo "Python says: " . htmlspecialchars($output);
}
?>
```

**Python (myscript.py):**

```python
import sys

if len(sys.argv) > 1:
    message = sys.argv[1]
else:
    message = "No message received"

print(f"Received: {message}")
```

**✅ Pros**

- Easy to implement.
- Works on most hosting environments.

**⚠️ Cons**

- Slower for frequent calls (starts a new Python process each time).
- Must handle security carefully (sanitize inputs).

## 2. Exchange structured data via JSON

If you need structured data, use JSON for communication.

**PHP:**

```php
<?php
$data = ["name" => "Alice", "age" => 30];
$jsonData = escapeshellarg(json_encode($data));

$command = "python3 process_data.py $jsonData";
$output = shell_exec($command);

$result = json_decode($output, true);
print_r($result);
?>
```

**Python (process_data.py):**

```python
import sys
import json

data = json.loads(sys.argv[1])
data["processed"] = True

print(json.dumps(data))
```

## 3. Use a local API (Flask + PHP cURL)

If you need real-time interaction or multiple calls, run Python as a microservice.

**Python (Flask API):**

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    data = request.json
    data['processed'] = True
    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5000)
```

**PHP client:**

```php
<?php
$url = "http://127.0.0.1:5000/process";
$data = ["name" => "Bob", "age" => 25];

$options = [
    'http' => [
        'header'  => "Content-Type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ],
];
$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

print_r(json_decode($result, true));
?>
```

**✅ Pros**

- Fast for repeated calls.
- Language-agnostic.
- Scales well.

## 4. Use a PHP ↔ Python bridge library

Libraries like `php-py` allow direct Python execution inside PHP without shell calls.

**Example:**

```php
<?php
require 'vendor/autoload.php';

use PhpPy\Python;

$py = new Python();
$result = $py->run('print("Hello from Python inside PHP")');
echo $result;
?>
```

## Recommendation

- **Simple one-off calls:** `shell_exec()` + JSON.
- **High-performance apps:** Flask/FastAPI + PHP cURL.
- **Tight integration:** a bridge library like `php-py`.

## Next steps

If you want, we can prepare a full working PHP + Python JSON integration example that you can run locally in XAMPP or WAMP.
