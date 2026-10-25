import * as https from 'https';
import * as http from 'http';

const POLLING_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 300000;

function azureRequest(url: string, method: string, body?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = JSON.parse(text);
          resolve(parsed);
        } catch {
          resolve(text);
        }
      });
    });

    req.on('error', reject);

    if (bodyStr) {
      req.write(bodyStr);
    }

    req.end();
  });
}

function queueBuild(project: string, definitionId: number, branch: string): Promise<number> {
  const collectionUri = process.env['SYSTEM_TEAMFOUNDATIONCOLLECTIONURI'] ?? 'https://dev.azure.com/monacotools/';
  const baseUrl = collectionUri.endsWith('/') ? collectionUri : `${collectionUri}/`;
  const url = `${baseUrl}${encodeURIComponent(project)}/_apis/build/builds?api-version=6.0`;

  const body = {
    definition: { id: definitionId },
    sourceBranch: branch,
  };

  return new Promise((resolve, reject) => {
    azureRequest(url, 'POST', body).then((result) => {
      const r = result as { id?: number };
      if (typeof r.id !== 'number') {
        reject(new Error(`Failed to queue build: unexpected response: ${JSON.stringify(result)}`));
        return;
      }
      resolve(r.id);
    }).catch(reject);
  });
}

function getBuildArtifacts(project: string, buildId: number): Promise<string[]> {
  const collectionUri = process.env['SYSTEM_TEAMFOUNDATIONCOLLECTIONURI'] ?? 'https://dev.azure.com/monacotools/';
  const baseUrl = collectionUri.endsWith('/') ? collectionUri : `${collectionUri}/`;
  const url = `${baseUrl}${encodeURIComponent(project)}/_apis/build/builds/${buildId}/artifacts?api-version=6.0`;

  return new Promise((resolve, reject) => {
    azureRequest(url, 'GET').then((result) => {
      const r = result as { value?: Array<{ name: string }> };
      if (!r.value) {
        resolve([]);
        return;
      }
      resolve(r.value.map((a) => a.name));
    }).catch(reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function publishBuildWithArtifacts(params: {
  project: string;
  definitionId: number;
  branch: string;
  artifactNames: string[];
  timeoutMs?: number;
}): Promise<number> {
  const { project, definitionId, branch, artifactNames } = params;
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return (async () => {
    const deadline = Date.now() + timeoutMs;

    let buildId: number;
    while (true) {
      try {
        buildId = await queueBuild(project, definitionId, branch);
        break;
      } catch (err) {
        if (Date.now() >= deadline) {
          throw new Error('Build timed out waiting for artifacts');
        }
        const remaining = deadline - Date.now();
        const waitTime = Math.min(POLLING_INTERVAL_MS, remaining);
        if (waitTime <= 0) {
          throw new Error('Build timed out waiting for artifacts');
        }
        await sleep(waitTime);
        if (Date.now() >= deadline) {
          throw new Error('Build timed out waiting for artifacts');
        }
      }
    }

    while (true) {
      let available: string[];
      try {
        available = await getBuildArtifacts(project, buildId);
      } catch {
        available = [];
      }
      const allFound = artifactNames.every((name) => available.includes(name));

      if (allFound) {
        return buildId;
      }

      if (Date.now() >= deadline) {
        throw new Error('Build timed out waiting for artifacts');
      }

      const remaining = deadline - Date.now();
      const waitTime = Math.min(POLLING_INTERVAL_MS, remaining);

      if (waitTime <= 0) {
        throw new Error('Build timed out waiting for artifacts');
      }

      await sleep(waitTime);

      if (Date.now() >= deadline) {
        throw new Error('Build timed out waiting for artifacts');
      }
    }
  })();
}