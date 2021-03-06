package org.genemania.adminweb.db.impl;

import static org.junit.Assert.assertNotNull;

import java.sql.SQLException;
import java.util.List;

import org.genemania.adminweb.dao.DatamartDb;
import org.genemania.adminweb.dao.OrganismDao;
import org.genemania.adminweb.entity.Organism;
import org.genemania.adminweb.service.SetupService;
import org.genemania.adminweb.testutils.BaseTest;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
public class DbImplTest extends BaseTest {

    @Test
    public void testGetCreateSql() throws Exception {
        List<String> stmts = getDmdb().getTableCreateStatements();
        assertNotNull(stmts);

        for (String stmt: stmts) {
            System.out.println(stmt + ';');
        }
    }

    @Test
    public void testGetOrganismDao() throws Exception {
        getSetupService().setup();
        OrganismDao organismDao = getDmdb().getOrganismDao();
        assertNotNull(organismDao);

        Organism organism = new Organism("Soylent green", "Hs");
        organismDao.create(organism);
    }
}
