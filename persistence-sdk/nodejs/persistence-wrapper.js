const axios = require('axios');
const { persist } = require('./persistence/persist');
const k8s = require('@kubernetes/client-node');

async function main() {
  const rawResultUrl = process.argv[2];
  const getRawResult = (url => () =>
    axios.get(url).then(({ data: findings }) => {
      console.log(`Fetched ${findings.length} findings from the file storage`);
      return findings;
    }))(rawResultUrl);

  const findingsUrl = process.argv[3];
  const getFindings = (url => () =>
    axios.get(url).then(res => {
      console.log(`Fetched raw result file contents from the file storage`);
      return res.data;
    }))(findingsUrl);

  const scanName = process.env['SCAN_NAME'];
  const namespace = process.env['NAMESPACE'];
  console.log(`Starting PersistenceProvider for Scan "${scanName}"`);

  const kc = new k8s.KubeConfig();
  kc.loadFromCluster();

  const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

  let scan;
  try {
    const { body } = await k8sApi.getNamespacedCustomObject(
      'execution.experimental.securecodebox.io',
      'v1',
      namespace,
      'scans',
      scanName
    );
    scan = body;
  } catch (err) {
    console.error('Failed to get Scan from the kubernetes api');
    console.error(err);
    process.exit(1);
  }

  try {
    await persist({ getRawResult, getFindings, scan });
  } catch (error) {
    console.error(
      'Error was thrown while running PersistenceProviders persist function'
    );
    console.error(error);
    process.exit(1);
  }

  console.log(`Completed PersistenceProvider`);
}

main();
