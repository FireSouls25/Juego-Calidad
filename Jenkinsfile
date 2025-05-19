pipeline {
    agent any

    environment {
    MONGO_URI="mongodb://127.0.0.1:27017/threejs_blocks"
    PORT=3001
    API_URL=http://localhost:3001/api/blocks/batch
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    cd game-project
                    npm install
                    npm install --save-dev jest babel-jest @babel/preset-env @babel/preset-react
                    cd ../backend
                    npm install
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                    cd game-project
                    npm test
                '''
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    cd game-project
                    npm run build
                '''
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                    cd backend
                    npm run build
                '''
            }
        }

        stage('Deploy to Vercel') {
            steps {
                withCredentials([string(credentialsId: 'vercel_token_game', variable: 'Zylh6JC3yIm1UUd3kYylyvbo')]) {
                    sh '''
                        cd game-project
                        npm install -g vercel
                        vercel --token ${ylh6JC3yIm1UUd3kYylyvbo} --prod
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
} 