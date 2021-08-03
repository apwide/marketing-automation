podTemplate(label: 'marketing-automation-image',
    workspaceVolume: emptyDirWorkspaceVolume(memory: true),
    volumes: [
        secretVolume(mountPath: '/kaniko/.docker/', secretName: 'kaniko-apwide-docker')
    ],
    containers: [
        containerTemplate(
            name:'kaniko',
            image: 'gcr.io/kaniko-project/executor:debug',
            ttyEnabled: true,
            command: "sleep 100000"
        )
    ]
) {
  node('marketing-automation-image') {
    container('kaniko') {
      stage('build-image') {
        checkout scm
        sh "/kaniko/executor --context=${env.WORKSPACE} --dockerfile=Dockerfile  --destination=docker.apwide.com/marketing-automation:8.0"
      }
    }
  }
}
