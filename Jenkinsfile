pipeline {
    agent any

    environment {
        NODE_VERSION = '18.x'
        MONGODB_URI = credentials('mongodb-uri')
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
                withCredentials([string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN')]) {
                    sh '''
                        cd game-project
                        npm install -g vercel
                        vercel --token ${VERCEL_TOKEN} --prod
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