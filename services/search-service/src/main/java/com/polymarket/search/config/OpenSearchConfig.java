package com.polymarket.search.config;

import javax.net.ssl.SSLEngine;
import javax.net.ssl.SSLContext;

import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManager;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.ClientTlsStrategyBuilder;
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier;
import org.apache.hc.core5.function.Factory;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.nio.ssl.TlsStrategy;
import org.apache.hc.core5.reactor.ssl.TlsDetails;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenSearchConfig {

    @Value("${opensearch.uri:http://localhost:9200}")
    private String uri;

    @Value("${opensearch.username:}")
    private String username;

    @Value("${opensearch.password:}")
    private String password;

    @Value("${opensearch.ssl.trust-all:false}")
    private boolean trustAllSsl;

    @Bean
    public OpenSearchClient openSearchClient() throws Exception {
        var parsed    = java.net.URI.create(uri);
        var host      = new HttpHost(parsed.getScheme(), parsed.getHost(), parsed.getPort());
        var builder   = ApacheHttpClient5TransportBuilder
                .builder(host)
                .setMapper(new JacksonJsonpMapper());

        if (hasCredentials() || trustAllSsl) {
            var credentialsProvider = new BasicCredentialsProvider();
            if (hasCredentials()) {
                credentialsProvider.setCredentials(
                        new AuthScope(host),
                        new UsernamePasswordCredentials(username, password.toCharArray())
                );
            }

            var connectionManager = trustAllSsl ? trustAllConnectionManager() : null;
            builder.setHttpClientConfigCallback(httpClientBuilder -> {
                if (hasCredentials()) {
                    httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider);
                }
                if (connectionManager != null) {
                    httpClientBuilder.setConnectionManager(connectionManager);
                }
                return httpClientBuilder;
            });
        }

        return new OpenSearchClient(builder.build());
    }

    private boolean hasCredentials() {
        return username != null && !username.isBlank() && password != null && !password.isBlank();
    }

    private PoolingAsyncClientConnectionManager trustAllConnectionManager() throws Exception {
        SSLContext sslContext = SSLContextBuilder
                .create()
                .loadTrustMaterial(null, (chains, authType) -> true)
                .build();

        TlsStrategy tlsStrategy = ClientTlsStrategyBuilder
                .create()
                .setSslContext(sslContext)
                .setHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                .setTlsDetailsFactory(new Factory<SSLEngine, TlsDetails>() {
                    @Override
                    public TlsDetails create(final SSLEngine sslEngine) {
                        return new TlsDetails(sslEngine.getSession(), sslEngine.getApplicationProtocol());
                    }
                })
                .build();

        return PoolingAsyncClientConnectionManagerBuilder
                .create()
                .setTlsStrategy(tlsStrategy)
                .build();
    }
}
