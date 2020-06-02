# instructions tested on MAC OS

# prereqs - kubernetes cluster up and running locally or on Azure. 
# prereqs - kube cli installed and connected to kube cluster above

brew install helm

git clone https://github.com/hashicorp/vault-helm.git
git checkout v0.2.1

cd vault-helm

helm install vault .

kubectl exec -it vault-0 -- vault status

kubectl exec -it vault-0 -- vault operator init -n 1 -t 1

