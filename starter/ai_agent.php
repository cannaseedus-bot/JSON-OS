<?php

$planPath = __DIR__ . '/PLAN.md';
$outputDir = __DIR__ . '/output';

if (!file_exists($planPath)) {
    fwrite(STDERR, "PLAN.md not found at {$planPath}\n");
    exit(1);
}

$plan = file_get_contents($planPath);
$lines = preg_split('/\R/', $plan);

$inTodo = false;
$tasks = [];

foreach ($lines as $line) {
    if (preg_match('/^##\s+TODO/', $line)) {
        $inTodo = true;
        continue;
    }

    if ($inTodo && preg_match('/^##\s+/', $line)) {
        $inTodo = false;
    }

    if ($inTodo && preg_match('/^- \[ \] (.+)$/', $line, $matches)) {
        $tasks[] = $matches[1];
    }
}

if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$updatedPlan = $plan;

foreach ($tasks as $index => $task) {
    $taskSlug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $task));
    $taskSlug = trim($taskSlug, '-');
    $filename = sprintf('%02d-%s.kuhul.json', $index + 1, $taskSlug);
    $outputPath = $outputDir . '/' . $filename;

    $payload = [
        'task' => $task,
        'status' => 'generated',
        'generator' => 'starter/ai_agent.php',
        'notes' => [
            'Replace this payload with kuhul-es generated output.',
            'Ensure deterministic block emission for reproducible runs.'
        ]
    ];

    $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    file_put_contents($outputPath, $json . "\n");

    $updatedPlan = str_replace("- [ ] {$task}", "- [x] {$task}", $updatedPlan);
    echo "Generated: {$outputPath}\n";
}

file_put_contents($planPath, $updatedPlan);

if (count($tasks) === 0) {
    echo "No incomplete tasks found.\n";
}
