# Jenkins CI/CD Pipeline for Java Applications with Kubernetes, Helm, SonarQube, and Argo CD

Pipeline.png

This repository provides a comprehensive Jenkins CI/CD pipeline for Java-based applications, demonstrating an end-to-end automated workflow from code commit to production deployment. It integrates popular tools such as **Maven** for building, **SonarQube** for code quality analysis, **Helm** for packaging, **Kubernetes** for orchestration, and **Argo CD** for GitOps-driven continuous delivery.

-----

## Features

  * **Automated Builds**: Compiles and packages your Java application using Maven.
  * **Code Quality Checks**: Integrates SonarQube for static code analysis, ensuring high code quality.
  * **Unit Testing**: Runs unit tests (e.g., JUnit, Mockito) to validate code functionality.
  * **Containerization Readiness**: Prepares your application for deployment to Kubernetes.
  * **Helm Chart Deployment**: Uses Helm to package and deploy your application to a test environment.
  * **User Acceptance Testing (UAT)**: Includes a stage for running UAT on the deployed application.
  * **GitOps with Argo CD**: Leverages Argo CD for automated, declarative deployments to production environments.
  * **Full CI/CD Automation**: Streamlines the entire development and deployment lifecycle.

-----

## Prerequisites

Before you get started, make sure you have the following in place:

  * **Java Application Code**: Your application code hosted on a Git repository (e.g., GitHub, GitLab, Bitbucket).
  * **Jenkins Server**: A running Jenkins instance.
  * **Kubernetes Cluster**: An active Kubernetes cluster.
  * **Helm**: Helm installed and configured on your local machine or within your Jenkins environment.
  * **Argo CD**: Argo CD installed and configured on your Kubernetes cluster.

-----

## Getting Started

Follow these steps to set up and run the Jenkins pipeline for your Java application:

### 1\. Install Jenkins Plugins

Ensure your Jenkins server has the following essential plugins installed:

  * **Git plugin**
  * **Maven Integration plugin**
  * **Pipeline plugin**
  * **Kubernetes Continuous Deploy plugin** (or a similar plugin for Helm/Kubernetes interactions)
  * **SonarQube Scanner for Jenkins**

You can install these via **Manage Jenkins** \> **Plugins** \> **Available plugins**.

### 2\. Create a Jenkins Pipeline Job

1.  In Jenkins, navigate to **New Item**.
2.  Enter a name for your pipeline job and select **Pipeline**.
3.  Under the **Pipeline** section, choose **Pipeline script from SCM**.
4.  Select **Git** as your SCM.
5.  Enter the **Repository URL** of your Java application's Git repository.
6.  Specify `Jenkinsfile` as the **Script Path**.

### 3\. Define Your `Jenkinsfile`

The core of this pipeline is defined in a `Jenkinsfile` located at the root of your Git repository. This file orchestrates the various stages of the CI/CD process.

```groovy
// Example Jenkinsfile (customize paths and configurations as needed)
pipeline {
    agent any

    environment {
        // SonarQube details
        SONAR_SCANNER_HOME = tool 'SonarQubeScanner' // Configure SonarQube Scanner in Jenkins Global Tool Configuration
        SONAR_HOST_URL = 'http://your-sonarqube-server:9000' // Replace with your SonarQube URL
        // Argo CD details
        ARGOCD_SERVER = 'your-argocd-server-url' // Replace with your Argo CD server URL
        ARGOCD_AUTH_TOKEN = credentials('your-argocd-api-token') // Jenkins credential ID for Argo CD API token
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-org/your-java-app.git' // Replace with your repo and branch
            }
        }

        stage('Build') {
            steps {
                sh 'mvn clean install -DskipTests'
            }
        }

        stage('Unit Tests') {
            steps {
                sh 'mvn test' // Assuming JUnit/Mockito are configured in pom.xml
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml' // Publish JUnit test results
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv(installationName: 'SonarQube', credentialsId: 'your-sonarqube-token') { // Configure SonarQube server and token in Jenkins
                    sh "mvn sonar:sonar -Dsonar.projectKey=your-java-app -Dsonar.host.url=${SONAR_HOST_URL}"
                }
            }
        }

        stage('Package JAR') {
            steps {
                sh 'mvn package'
            }
        }

        stage('Deploy to Test Environment (Helm)') {
            steps {
                // Ensure your Helm chart is in a sub-directory, e.g., 'helm-chart'
                script {
                    def appVersion = sh(returnStdout: true, script: "mvn help:evaluate -Dexpression=project.version -q -DforceStdout").trim()
                    // Assuming your Helm chart is in a 'helm-chart' directory relative to the workspace
                    sh "helm upgrade --install your-app-test ./helm-chart --namespace test --set image.tag=${appVersion} --set environment=test"
                }
            }
        }

        stage('Run User Acceptance Tests') {
            steps {
                echo 'Running UATs...'
                // Add your UAT execution steps here, e.g., calling a Selenium script or a separate testing framework
                // sh 'java -jar your-uat-runner.jar'
            }
        }

        stage('Promote to Production (Argo CD)') {
            steps {
                withCredentials([string(credentialsId: ARGOCD_AUTH_TOKEN, variable: 'ARGOCD_TOKEN')]) {
                    // Update the Git repository that Argo CD is tracking for the production environment
                    // This typically involves updating a specific file in the Git repository Argo CD monitors,
                    // which in turn triggers Argo CD to sync the changes.
                    // Example: pushing a new image tag to a values.yaml file in a GitOps repo
                    sh "git clone https://github.com/your-org/your-argocd-config-repo.git argocd-config" // Clone your GitOps repo
                    dir('argocd-config') {
                        sh "git config user.email 'jenkins@example.com'"
                        sh "git config user.name 'Jenkins'"
                        sh "sed -i 's|image:.*|image: your-docker-registry/your-app:${env.BUILD_NUMBER}|g' environments/prod/values.yaml" // Update image tag
                        sh "git add ."
                        sh "git commit -m 'Update application image to build ${env.BUILD_NUMBER}'"
                        sh "git push https://your-git-token@github.com/your-org/your-argocd-config-repo.git HEAD:main" // Push changes
                    }
                    echo "Triggered Argo CD sync for production environment."
                    // Optionally, you can directly use Argo CD CLI to sync an application if not relying solely on Git polling
                    // sh "argocd app sync your-prod-application --server ${ARGOCD_SERVER} --auth-token ${ARGOCD_TOKEN}"
                }
            }
        }
    }
}
```

### 4\. Configure Argo CD

1.  **Install Argo CD**: If you haven't already, install Argo CD on your Kubernetes cluster. Refer to the [Argo CD documentation](https://argo-cd.readthedocs.io/en/stable/getting_started/) for installation instructions.
2.  **GitOps Repository**: Set up a dedicated Git repository that Argo CD will monitor for your Helm charts and Kubernetes manifests. This repository will contain the desired state of your applications.
3.  **Helm Chart**: Create a **Helm chart** for your Java application. This chart should include your Kubernetes manifests (Deployments, Services, Ingress, etc.) and a `values.yaml` file for configuration.
      * Place this Helm chart in your GitOps repository.
4.  **Argo CD Application**: Configure an Argo CD application that points to your Helm chart within the GitOps repository. This tells Argo CD to deploy and synchronize your application.

### 5\. Integrate Jenkins with Argo CD

1.  **Argo CD API Token**: Generate an API token from your Argo CD instance.
2.  **Jenkins Credentials**: In Jenkins, go to **Manage Jenkins** \> **Manage Credentials** \> **(your domain)** \> **Global credentials (unrestricted)** \> **Add Credentials**.
      * Select **Secret text** for **Kind**.
      * Paste your Argo CD API token into the **Secret** field.
      * Give it a unique **ID** (e.g., `your-argocd-api-token`) and a **Description**.
3.  **Update `Jenkinsfile`**: Ensure your `Jenkinsfile` (as shown in the example above) uses this credential ID for authentication with Argo CD. The `ARGOCD_AUTH_TOKEN` environment variable and `withCredentials` block handle this securely.

-----

## Running the Pipeline

Once everything is configured, trigger your Jenkins pipeline:

1.  Manually by clicking **Build Now** in your Jenkins job.
2.  Automatically via a Git webhook whenever changes are pushed to your application's repository.

Monitor the pipeline stages in Jenkins to track the progress and troubleshoot any issues.

-----

## Pipeline Stages Explained

  * **Checkout**: Fetches the latest source code from your Git repository.
  * **Build**: Compiles the Java application using Maven.
  * **Unit Tests**: Executes unit tests and publishes their results.
  * **SonarQube Analysis**: Performs static code analysis, pushing results to your SonarQube server.
  * **Package JAR**: Creates the final JAR artifact of your application.
  * **Deploy to Test Environment (Helm)**: Uses Helm to deploy your application to a designated test Kubernetes namespace.
  * **Run User Acceptance Tests**: Executes any defined UATs against the deployed test environment.
  * **Promote to Production (Argo CD)**: Updates the GitOps repository (e.g., a new image tag in a `values.yaml` file), which triggers Argo CD to automatically synchronize and deploy the new version to the production Kubernetes environment.

-----

This end-to-end Jenkins pipeline provides a robust and automated CI/CD solution for your Java applications, leveraging industry-standard tools to ensure efficient development, high code quality, and reliable deployments.
