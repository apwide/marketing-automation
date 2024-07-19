node('docker') {
  container('kaniko') {
    stage('build-image') {
      checkout scm
      sh "/kaniko/executor --context=${env.WORKSPACE} --dockerfile=Dockerfile  --destination=docker.apwide.com/marketing-automation:21.0"
    }
  }
}
