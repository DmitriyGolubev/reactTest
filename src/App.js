import React from 'react';
import './App.css';
import {Chart} from 'react-google-charts';
import axios from 'axios';
import DayPicker, {DateUtils} from 'react-day-picker';
import moment from 'moment/moment';
import CsvDownloader from 'react-csv-downloader';

import 'react-day-picker/lib/style.css';


export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.chartEvents = [
            {
                eventName: 'select',
                callback(Chart) {
                    // Returns Chart so you can access props and  the ChartWrapper object from chart.wrapper
                    console.log('Selected ', Chart.chart.getSelection());
                },
            },
        ];

        this.state = {
            table: false,

            defaultCurrency: {
                name: 'USD',
                id: 145
            },
            currentCurrency: {
                name: 'USD',
                id: 145
            },

            rows: [[new Date(), 0]],
            from: new Date(),
            to: new Date(),
            tableData: [],
            csvTable: [{
                first: 'foo',
                second: 'bar'
            }, {
                first: 'foobar',
                second: 'foobar'
            }],
            csvColumns : [{
                id: 'first',
                displayName: 'First column'
            }, {
                id: 'second',
                displayName: 'Second column'
            }],

            currencies: [
                {
                    name: 'USD',
                    id: 145
                },
                {
                    name: 'EUR',
                    id: 292
                },
                {
                    name: 'RUR',
                    id: 298
                }
            ],

            tableCurrencies: [],

            columns: [
                {
                    type: 'date',
                    label: 'Date'
                },
                {
                    type: 'number',
                    label: 'Rate'
                },

            ],
        }
        this.getRates = this.getRates.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.handleResetClick = this.handleResetClick.bind(this);
        this.changeCurrency = this.changeCurrency.bind(this);
        this.changeCurrencyAndGetData = this.changeCurrencyAndGetData.bind(this);
        this.addCurrency = this.addCurrency.bind(this);
        this.changeView = this.changeView.bind(this);
        this.deleteColumn = this.deleteColumn.bind(this);
        this.getRates(145);
    }

    deleteColumn(index) {
        this.state.tableData.map(item => {
            item.splice(index+1, 1);
        })
        this.state.tableCurrencies.splice(index, 1);
        this.setState({tableDate: this.state.tableData, tableCurrencies: this.state.tableCurrencies});
        this.setScvData();
    }

    addCurrency() {
        this.state.tableCurrencies.push(this.state.currentCurrency);
        this.setState({tableCurrencies: this.state.tableCurrencies});
        this.getRates(this.state.currentCurrency.id).then(() => this.setScvData());
    }

    changeCurrencyAndGetData = (event) => {
        this.changeCurrency(event);
        this.getRates(+event.target.value);
    };

    changeCurrency = (event) => {
        var currency = this.state.currencies.find(cur => cur.id === +event.target.value);
        this.state.currentCurrency = currency;
        this.setState({currentCurrency :currency})
    };


    handleDayClick = day => {
        const range = DateUtils.addDayToRange(day, this.state);

        this.state.from = range.from;
        this.state.to = range.to;

        this.getRates(this.state.currentCurrency.id);
    };
    handleResetClick = e => {
        e.preventDefault();

        this.state.from = new Date();
        this.state.to = new Date();
        this.getRates(this.state.currentCurrency.id);
    };

    changeView() {
        if (this.state.table === true) {
            this.state.tableCurrencies = [];
            this.state.currentCurrency = this.state.defaultCurrency;
            this.state.tableData = [];
        } else {
            this.state.tableCurrencies.push(this.state.currentCurrency);

            this.state.rows.forEach(item => {
                let obj = [];
                obj.push(item[0]);
                obj.push(item[1]);
                this.state.tableData.push(obj);
            });
            this.setScvData();
        }
        this.setState({table: !this.state.table});
    }

    getRates(currencyId) {
        return axios.get(`http://www.nbrb.by/API/ExRates/Rates/Dynamics/${currencyId}?startDate=${this.state.from.getFullYear() + '-' + (this.state.from.getMonth() + 1) + '-'
        + this.state.from.getDate()}&endDate=${this.state.to.getFullYear() + '-' + (this.state.to.getMonth() + 1) + '-'
        + this.state.to.getDate()}`)
            .then(response => {
                if (this.state.table) {
                    this.state.tableData.forEach((item, index) => item.push(response.data[index].Cur_OfficialRate));
                    this.setState({tableData: this.state.tableData});
                } else {
                    let fullArray = [];
                    for (let i = 0; i < response.data.length; i++) {
                        let arr = []

                        var date = new Date(response.data[i].Date)
                        arr.push(date);
                        arr.push(response.data[i].Cur_OfficialRate);

                        fullArray.push(arr);
                    }
                    this.setState({rows: fullArray})
                }
            })
            .catch(error => {
                console.log('Error fetching and parsing data', error);
            });
    }

    setScvData() {
        this.state.csvColumns = [];
        let id = 0;
        this.state.csvColumns.push({id:id, displayName: 'Date' });
        id++;
        this.state.tableCurrencies.forEach(item => {
            this.state.csvColumns.push({id:id, displayName: item.name });
            id++;
        });

        this.state.csvTable = [];

        this.state.tableData.forEach(row => {
            let obj = {};
            row.forEach((val, index) => {
                obj[index] = val;
            })
            this.state.csvTable.push(obj);
        })
        console.log(this.state.csvTable);
        console.log(this.state.csvColumns);
        this.setState({csvTable: this.state.csvTable, csvColumns: this.state.csvColumns})
    }

    render() {

        var options = {
            title: `rate of the Belarusian ruble to ` + this.state.currency,
            vAxis: {title: this.state.currency},
            hAxis: {title: 'Date'},
        };
        const {from, to} = this.state;

        return (

            <div className="Main">
                Select a view
                <button onClick={this.changeView}>{!this.state.table ? 'Table' : 'Chart'}</button>
                <div style={{display: this.state.table ? '' : 'none'}}>
                    <CsvDownloader
                        filename="myfile"
                        columns={this.state.csvColumns}
                        datas={this.state.csvTable}
                        text="DOWNLOAD"
                        >
                        <button>Download</button>
                    </CsvDownloader>
                    <div>
                        Add currency
                        <select onChange={this.changeCurrency} value={this.state.currentCurrency.id}>
                            {this.state.currencies.map((item) => {
                                return (   <option value={item.id}>{item.name}</option>)
                            })}
                        </select>

                        <button onClick={this.addCurrency}>+</button>
                    </div>

                    <table style={{display: this.state.table ? '' : 'none'}}>
                        <tr>
                            <th>Date</th>
                            {this.state.tableCurrencies.map((item,index) => {
                                return (
                                    <th>{item.name}
                                    <button onClick={() => this.deleteColumn(index)}>x</button></th>
                                )
                            })}
                        </tr>
                        {this.state.tableData.map((item) => {
                            return (   <tr>
                                {item.map(col => {
                                    return <td>{col.toDateString ? col.toDateString() : col}</td>
                                })}
                            </tr>)
                        })}
                    </table>
                </div>
                <div style={{display: this.state.table ? 'none' : ''}}>

                    <Chart
                        chartType="LineChart"
                        rows={this.state.rows}
                        columns={this.state.columns}
                        options={options}
                        graph_id="LineChart"
                        width="100%"
                        height="400px"
                        chartEvents={this.chartEvents}
                    />

                    Choose currency
                    <select onChange={this.changeCurrencyAndGetData} value={this.state.currentCurrency.id}>
                        {this.state.currencies.map((item) => {
                            return (   <option value={item.id}>{item.name}</option>)
                        })}
                    </select>

                    <div className="RangeExample">
                        {!from && !to && <p>Please select the <strong>first day</strong>.</p>}
                        {from && !to && <p>Please select the <strong>last day</strong>.</p>}
                        {from &&
                        to &&
                        <p>
                            You chose from
                            {' '}
                            {moment(from).format('L')}
                            {' '}
                            to
                            {' '}
                            {moment(to).format('L')}
                            .
                            {' '}<a href="." onClick={this.handleResetClick}>Reset</a>
                        </p>}


                        <DayPicker
                            numberOfMonths={2}
                            selectedDays={[from, {from, to}]}
                            onDayClick={this.handleDayClick}
                            fixedWeeks
                        />
                    </div>

                </div>
            </div>

        );
    }
}
