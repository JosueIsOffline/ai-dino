/**
 * eslint-env node
 */

import gulp from "gulp";
const { src, dest, series, parallel, watch } = gulp;

import browserSyncPkg from "browser-sync";
const browserSync = browserSyncPkg.create();

import htmlMinify from "gulp-htmlmin";
import sourcemaps from "gulp-sourcemaps";
import * as sass from "sass";
import gulpSass from "gulp-sass";
const sasss = gulpSass(sass);

import { createGulpEsbuild } from "gulp-esbuild";
const gulpEsbuild = createGulpEsbuild({
	incremental: false,
	piping: true,
});

import cssAutoPrefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import { deleteAsync } from "del";

// Utilities
function isArgumentPassed(...args) {
	const processedArgs = [];

	for (let i = 0; i < args.length; i++) {
		if (!args[i].startsWith("--")) {
			processedArgs.push(`--${args[i]}`);
		} else {
			processedArgs.push(`-${args[i]}`);
		}
	}

	for (const key of processedArgs) {
		if (process.argv.includes(key)) return true;
		if (!key.startsWith("-") && key.toUpperCase() in process.env)
			return true;
	}

	return false;
}

// Env
const isProduction = isArgumentPassed("production", "prod");
const shouldMinify = true;
console.log(isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Options
const browserSyncOptions = {
	open: false,
	browser: false,
	ui: false,
	host: "0.0.0.0",
	server: {
		baseDir: "dist",
		port: 3000,
	},
};

const esbuildOptions = {
	outfile: "bundle.js",
	bundle: true,
	sourcemap: isProduction ? undefined : "both",
	target: ["es2015", "chrome58", "firefox57", "safari11", "edge18", "node12"],
	platform: "browser",
	minify: shouldMinify,
	minifyWhitespace: shouldMinify,
	minifyIdentifiers: shouldMinify,
	minifySyntax: shouldMinify,
	treeShaking: true,
	define: {
		DEBUG: isProduction ? "false" : "true",
	},
};

const htmlOptions = {
	collapseWhitespace: true,
	removeComments: true,
	removeRedundantAttributes: true,
};

const cssOptions = {
	outputStyle: "compressed",
	sourceCommments: false,
	sourceMap: false,
};

// Tasks
function reloadBrowsers() {
	return browserSync.reload({ stream: true });
}

async function clean() {
	return deleteAsync("dist");
}

function initializeBrowserSync() {
	return browserSync.init(browserSyncOptions);
}

function handleHtml() {
	return src("src/**/*.html")
		.pipe(htmlMinify(htmlOptions))
		.pipe(dest("dist"))
		.pipe(reloadBrowsers());
}

function watchHtml() {
	return watch("src/**/*.html", handleHtml);
}

function handleTs() {
	return src("./src/scripts/main.ts")
		.pipe(gulpEsbuild(esbuildOptions))
		.pipe(dest("./dist/scripts"))
		.pipe(reloadBrowsers());
}

function watchTs() {
	return watch("src/scripts/**/*.ts", handleTs);
}

function handleAssets() {
	return src("./src/assets/**/**.*", { encoding: false })
		.pipe(dest("./dist/assets"))
		.pipe(reloadBrowsers());
}

function handleFavicon() {
	return src("./src/assets/icons/**.*").pipe(dest("./dist"));
}

function watchAssets() {
	return watch("./src/assets/**/**.*", series(handleAssets, handleFavicon));
}

function handleSCSS() {
	return src("./src/styles/**.scss")
		.pipe(sourcemaps.init())
		.pipe(sasss(cssOptions).on("error", sasss.logError))
		.pipe(cssAutoPrefixer())
		.pipe(concat("styles.min.css"))
		.pipe(sourcemaps.write("./"))
		.pipe(dest("./dist/styles"))
		.pipe(reloadBrowsers());
}

function watchSCSS() {
	return watch("./src/styles/**.scss", handleSCSS);
}

// Create composite tasks
const buildTask = series(
	clean,
	parallel(handleAssets, handleSCSS, handleHtml, handleTs, handleFavicon),
);

const devTask = series(
	buildTask,
	parallel(watchAssets, watchSCSS, watchHtml, watchTs, initializeBrowserSync),
);

// Export public tasks
export { handleAssets as assets };
export { handleHtml as html };
export { handleTs as js };
export { handleSCSS as scss };
export { clean };
export { buildTask as build };
export { devTask as dev };
export default buildTask;
