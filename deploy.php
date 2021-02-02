<?php
namespace Deployer;

require 'recipe/common.php';

set('application', 'phala-miner-monitor');
set('repository', 'git@github.com:l00k/phala-miner-monitor-server.git');

set('git_tty', true);
set('allow_anonymous_stats', false);

set('shared_dirs', [
    '.db-data',
    '.cert',
]);
set('shared_files', [
    '.env',
]);

host('main')
    ->hostname('100k-dev-server')
    ->user('l00k')
    ->set('deploy_path', '/srv/web/phala-miner-monitor-server');

localhost('local')
    ->user('l00k')
    ->set('deploy_path', realpath(__DIR__));

localhost()
    ->shellCommand('bash -s');

desc('Deploy your project');
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:lock',
    'deploy:release',
    'deploy:update_code',
    'deploy:shared',
    'deploy:writable',
    'deploy:vendors',
    'deploy:clear_paths',
    'deploy:symlink',
    'server:restart',
    'deploy:unlock',
    'cleanup',
    'success'
]);

after('deploy:failed', 'deploy:unlock');


task('server:restart', function () {
    run("
        cd {{deploy_path}}/current;
        chmod +x etc/run.sh
        docker stop web-phala-miner-monitor-node
        docker stop web-phala-miner-monitor-db
        docker-compose down
        docker container rm web-phala-miner-monitor-node
        docker container rm web-phala-miner-monitor-db
        docker-compose build
        docker-compose up -d
    ", [ 'tty' => true ]);
});

task('server:cleanup', function () {
    run("
        cd {{deploy_path}}/current;
        chmod +x etc/run.sh
        docker stop web-phala-miner-monitor-node
        docker stop web-phala-miner-monitor-db
        docker container rm web-phala-miner-monitor-node
        docker container rm web-phala-miner-monitor-db
        rm -rf {{deploy_path}}/shared/.db-data/*
    ", [ 'tty' => true ]);
});


task('db:backup', function () {
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    $envPath = test('[[ -e {{deploy_path}}/shared ]]')
        ? 'shared/.env'
        : './.env';

    run("
        cd {{deploy_path}}
        set -o allexport; source $envPath; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -u root -proot \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);
});

task('db:pull', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    run("
        cd {{deploy_path}}
        set -o allexport; source shared/.env; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    try {
        runLocally("
            cd $localCwd
            [[ ! -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
        ");

        download(
            "{{deploy_path}}/.dep/dbdumps/$dumpname",
            "$localCwd/.dep/dbdumps/$dumpname"
        );

        runLocally("
            cd $localCwd
            set -o allexport; source $localCwd/.env; set +o allexport;
            mysql -h 127.0.0.1 -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < $localCwd/.dep/dbdumps/$dumpname;
        ");
    }
    catch(\throwable $e) {
    }

    run("cd {{deploy_path}} && rm .dep/dbdumps/$dumpname");
});

task('db:push', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    runLocally("
        cd $localCwd
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    runLocally("
        cd $localCwd
        set -o allexport; source $localCwd/.env; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -u root -proot \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    try {
        run("
            cd {{deploy_path}}
            [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
        ");

        upload(
            "$localCwd/.dep/dbdumps/$dumpname",
            "{{deploy_path}}/.dep/dbdumps/$dumpname"
        );

        run("
            cd {{deploy_path}}
            set -o allexport; source shared/.env; set +o allexport
            mysql -h 127.0.0.1 -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < .dep/dbdumps/$dumpname;
        ");
    }
    catch(\throwable $e) {
    }

    runLocally("rm .dep/dbdumps/$dumpname");
});
