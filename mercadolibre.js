// DEFINITIONS

const puppeteer = require('puppeteer');
const chalk = require('chalk');
const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs')
const csv = require('csv-parser')


//SEARCH DIALOG
console.log('');
console.log(chalk.yellow('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'));
console.log(chalk.white('SEARCH MERCADOLIBRE     3.0   by Charlie '));
console.log(chalk.yellow('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'));
console.log('');
const prompt = require('prompt-sync')();
const name = prompt('Palabra clave a buscar?  :  ');
console.log('');
console.log(chalk.white(`Resultados cargando... ${name}`));
console.log('');
console.log(chalk.white('Total de productos encontrados'));
console.log('');

//END OF SEARCH DIALOG

// SHOWS NUMBER OF TOTAL RESULTS FROM SEARCH
console.log(chalk.yellow('-------------------------------------------------------------------'));

const URL = (`https://listado.mercadolibre.com.ar/${name}#D[A:${name}]`);

(async () => {

    const response = await request (URL);

//    console.log(response);

    let $ = cheerio.load(response);
    let productosencontradosLabel = $('div[class="ui-search-search-result"] > span').text();
    let productosencontradosNumStr = productosencontradosLabel.replace(' resultados','');
    let productosencontradosNumStrx = productosencontradosNumStr.replace('.','');

    console.log((productosencontradosNumStr) + ' RESULTADOS');
    console.log(chalk.yellow('-------------------------------------------------------------------'));
    let productosencontradosNumInt = parseInt(productosencontradosNumStrx);

    if ((productosencontradosNumInt/50) < 1)
    {
      console.log('PAGINAS 1/1');
      console.log(' ');
      console.log(' ');
    }
    else
    {
      let pagesToScrapeNum = Math.ceil(productosencontradosNumInt/50);
      console.log('PAGINAS 1/' + pagesToScrapeNum);
      console.log(' ');
      console.log(' ');

    }

})()

// BRINGS ALL THE RESULTS (STILL WORK IN PROGRESS)
function runSearch (pagesToScrape) {
    return new Promise(async (resolve, reject) => {
        try {

              const response = await request (URL);
              let $ = cheerio.load(response);
              let productosencontradosLabel = $('div[class="ui-search-search-result"] > span').text();
              let productosencontradosNumStr = productosencontradosLabel.replace(' resultados','');
              let productosencontradosNumStrx = productosencontradosNumStr.replace('.','');
              let productosencontradosNumInt = parseInt(productosencontradosNumStrx);
              let pagesToScrapeNum = Math.ceil(productosencontradosNumInt/50);


              const pagesToScrape = pagesToScrapeNum;
              //console.log('Pages to scrape forward are:  ' + pagesToScrape);
              const browser = await puppeteer.launch();
              const page = (await browser.pages())[0];
              await page.goto(`https://listado.mercadolibre.com.ar/${name}#D[A:${name}]`);


              let currentPage = 1;
              let urls = [];
              while (currentPage <= pagesToScrape) {
                  let newUrls = await page.evaluate(() => {
                      let results = [];

                      let producto = document.querySelectorAll('h2.ui-search-item__title');
                      producto.forEach((item) => {
                          results.push({
                              VENDO: item.innerText,

                          });
                      });

                      let precio = document.querySelectorAll('div.ui-search-price__second-line');
                      precio.forEach((item) => {
                          results.push({
                              PRECIO: item.textContent,

                          });
                      });

                      return results;

                      // EL CODIGO A CONTINUACION NO ESTA HACIENDO NADA

                      function writeToCSVFile(results) {
                        const filename = 'output.csv';
                        fs.writeFile(filename, extractAsCSV(results), err => {
                          if (err) {
                            console.log('Error writing to csv file', err);
                          } else {
                            console.log(`saved as ${filename}`);
                          }
                        });
                      }
                      function extractAsCSV(results) {
                        const header = ["Producto, Precio"];
                        const rows = results.map(user =>
                          `${results.producto}, ${results.precio}`
                        );
                        return header.concat(rows).join("\n");
                      }

                      // TERMINA CODIGO INSERVIBLE....


                    });

                  urls = urls.concat(newUrls);
                  if (currentPage < pagesToScrape) {

                      await Promise.all([
                          await page.click('a.andes-pagination__link.ui-search-link'),
                          await page.waitForSelector('h2.ui-search-item__title'),
                      ])
                  }
                  currentPage++;
                  //console.log(currentPage);

              }
              browser.close();
              return resolve(urls);
          } catch (e) {
              return reject(e);
          }
      })
  }
runSearch().then(console.log).catch(console.error);
