import dns from "dns"
import https from "https"
import { readFile } from "fs/promises"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const checkInternetConnection = () => {
	return new Promise((resolve, reject) => {
		dns.lookup("example.com", (err) => {
			if (err && err.code === "ENOTFOUND") {
				reject(new Error("No internet connection to check for LiteNode's update"))
			} else {
				resolve()
			}
		})
	})
}

export const checkForUpdate = async () => {
	try {
		await checkInternetConnection()

		const packageJsonPath = resolve(__dirname, "../../package.json")
		const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"))

		const packageName = packageJson.name
		const currentVersion = packageJson.version

		const getLatestVersion = (packageName) => {
			return new Promise((resolve, reject) => {
				const url = `https://registry.npmjs.org/${packageName}/latest`
				https
					.get(url, (res) => {
						let data = ""
						res.on("data", (chunk) => {
							data += chunk
						})
						res.on("end", () => {
							if (res.statusCode === 404) {
								reject(new Error(`Package not found: ${packageName}`))
							} else if (res.statusCode !== 200) {
								reject(new Error(`Failed to fetch version: ${res.statusCode}`))
							} else {
								const latestVersion = JSON.parse(data).version
								resolve(latestVersion)
							}
						})
					})
					.on("error", (err) => {
						reject(err)
					})
			})
		}

		const compareVersions = (current, latest) => {
			const currentParts = current.split(".").map(Number)
			const latestParts = latest.split(".").map(Number)

			for (let i = 0; i < 3; i++) {
				if (currentParts[i] < latestParts[i]) return -1
				if (currentParts[i] > latestParts[i]) return 1
			}
			return 0
		}

		const latestVersion = await getLatestVersion(packageName)
		const comparison = compareVersions(currentVersion, latestVersion)

		if (comparison === -1) {
			console.log(`Update available for ${packageName}: ${latestVersion} (current: ${currentVersion})`)
		} else if (comparison === 1) {
			console.log(`You have a newer version of ${packageName}: ${currentVersion} (latest: ${latestVersion})`)
		} else {
			console.log(`You have the latest version of ${packageName}`)
		}
	} catch (err) {
		console.error("Error checking for updates:", err)
	}
}
